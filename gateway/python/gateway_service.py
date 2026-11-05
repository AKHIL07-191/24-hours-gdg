import time
import requests
import logging
from typing import Dict, Any, Optional
from gateway.python.local_queue import GatewayLocalQueue

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("GatewayBridge")

class GatewayBridgeService:
    def __init__(
        self,
        backend_url: str = "http://127.0.0.1:8000/api/v1",
        gateway_id: str = "ANDROID_GATEWAY_01",
        gateway_api_key: str = "resqnet-gateway-token-secret",
        db_path: str = "gateway_local.db"
    ):
        self.backend_url = backend_url.rstrip("/")
        self.gateway_id = gateway_id
        self.gateway_api_key = gateway_api_key
        self.queue = GatewayLocalQueue(db_path=db_path)
        self.is_online = True

    def receive_sms_from_device(self, sender: str, text: str, msg_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Invoked when cellular SMS arrives at the Android Phone / Gateway.
        Immediately enqueues locally to ensure 0 message loss.
        """
        local_id = self.queue.enqueue_inbound_sms(sender, text, msg_id)
        logger.info(f"[SMS IN] Enqueued {local_id} from {sender}: {text}")

        # Attempt immediate synchronization if marked online
        if self.is_online:
            sync_res = self.sync_single_message(local_id, sender, text)
            return {"local_id": local_id, "status": "SYNCED" if sync_res else "QUEUED_OFFLINE"}
        else:
            logger.warning(f"[OFFLINE] Gateway internet unavailable. Message {local_id} preserved in local queue.")
            return {"local_id": local_id, "status": "QUEUED_OFFLINE"}

    def sync_single_message(self, local_id: str, sender: str, text: str) -> bool:
        url = f"{self.backend_url}/sms/inbound"
        headers = {"X-Gateway-Key": self.gateway_api_key}
        payload = {
            "message_id": local_id,
            "sender": sender,
            "text": text,
            "gateway_id": self.gateway_id
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=5)
            if resp.status_code == 200:
                self.queue.mark_inbound_synced([local_id])
                logger.info(f"[SYNC SUCCESS] {local_id} synced to backend: {resp.json().get('request_id')}")
                return True
            else:
                logger.warning(f"[SYNC FAILED] HTTP {resp.status_code}: {resp.text}")
                self.queue.record_sync_failure([local_id])
                return False
        except requests.RequestException as e:
            logger.warning(f"[NETWORK ERROR] Cannot reach backend: {e}")
            self.queue.record_sync_failure([local_id])
            return False

    def flush_pending_queue(self) -> Dict[str, Any]:
        """
        Called when internet connection returns. Flushes pending messages in batch.
        """
        pending = self.queue.get_pending_inbound(limit=50)
        if not pending:
            return {"status": "EMPTY", "synced": 0}

        logger.info(f"[BATCH SYNC] Syncing {len(pending)} cached emergency messages to backend...")
        url = f"{self.backend_url}/sms/sync-batch"
        headers = {"X-Gateway-Key": self.gateway_api_key}
        
        batch_payload = {
            "gateway_id": self.gateway_id,
            "messages": [
                {
                    "message_id": m["id"],
                    "sender": m["sender"],
                    "text": m["text"],
                    "timestamp": m["timestamp"],
                    "gateway_id": self.gateway_id
                }
                for m in pending
            ]
        }

        try:
            resp = requests.post(url, json=batch_payload, headers=headers, timeout=10)
            if resp.status_code == 200:
                synced_ids = [m["id"] for m in pending]
                self.queue.mark_inbound_synced(synced_ids)
                data = resp.json()
                logger.info(f"[BATCH SYNC SUCCESS] Synced: {data.get('processed_count')}, Duplicates: {data.get('duplicate_count')}")
                return {"status": "SUCCESS", "synced": len(synced_ids), "data": data}
            else:
                logger.warning(f"[BATCH SYNC FAILED] HTTP {resp.status_code}")
                self.queue.record_sync_failure([m["id"] for m in pending])
                return {"status": "FAILED", "code": resp.status_code}
        except requests.RequestException as e:
            logger.warning(f"[BATCH SYNC FAILED] Backend unreachable: {e}")
            self.queue.record_sync_failure([m["id"] for m in pending])
            return {"status": "OFFLINE", "error": str(e)}

    def poll_and_send_outbound_sms(self) -> int:
        """
        Fetches pending outbound SMS from the backend and transmits them via cellular SIM.
        """
        url = f"{self.backend_url}/sms/outbox/pending?gateway_id={self.gateway_id}"
        headers = {"X-Gateway-Key": self.gateway_api_key}
        try:
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                pending_list = resp.json().get("pending_sms", [])
                for msg in pending_list:
                    # In real hardware, this calls Android SmsManager.sendTextMessage(...)
                    logger.info(f"[CELLULAR SIM TRANSMIT] Sending SMS to {msg['phone_number']}: \"{msg['message_text']}\"")
                    # Report status back to backend
                    status_url = f"{self.backend_url}/sms/outbox/{msg['id']}/status"
                    requests.post(status_url, json={"status": "DELIVERED"}, headers=headers, timeout=5)
                return len(pending_list)
        except Exception as e:
            logger.warning(f"Error polling outbound SMS: {e}")
        return 0
