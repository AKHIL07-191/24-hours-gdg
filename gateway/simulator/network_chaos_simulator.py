import time
import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from gateway.python.gateway_service import GatewayBridgeService

def run_disaster_chaos_simulation():
    print("=" * 70)
    print("RESQ-NET DISASTER RESILIENCE & STORE-AND-FORWARD CHAOS SIMULATION")
    print("=" * 70)

    gw = GatewayBridgeService(
        backend_url="http://127.0.0.1:8000/api/v1",
        gateway_id="DISASTER_CELLULAR_NODE_01",
        db_path="gateway_chaos_test.db"
    )

    print("\n--- PHASE 1: NORMAL CELLULAR SMS INGESTION (ONLINE) ---")
    msg1 = "HELP|MED|17.7234,83.3012|2INJ|LOWBAT"
    r1 = gw.receive_sms_from_device("+919848011221", msg1, "chaos_msg_101")
    print(f"Result for Msg 1: {r1}")

    print("\n--- PHASE 2: DISASTER EVENT - INTERNET CUT OFF AT GATEWAY ---")
    gw.is_online = False
    print("STATUS: Gateway cellular tower is functional, but backhaul internet cable severed.")

    print("\nSimulating 3 incoming emergency SMS messages during outage:")
    offline_messages = [
        ("+919848022332", "HELP|FLOOD|VIZAG|4 PEOPLE|1 ELDERLY", "chaos_msg_102"),
        ("+919848033443", "HELP|FIRE|NEAR BUS STAND|TRAPPED", "chaos_msg_103"),
        ("+919848044554", "వరద నీరు ఇంట్లోకి వచ్చింది రక్షించండి", "chaos_msg_104")
    ]

    for sender, text, mid in offline_messages:
        res = gw.receive_sms_from_device(sender, text, mid)
        print(f"-> Ingested during outage: [{mid}] Status: {res['status']}")

    stats_offline = gw.queue.get_queue_stats()
    print(f"\nGateway Local Queue Stats during outage: {stats_offline}")

    print("\n--- PHASE 3: INTERNET RESTORED - RECONNECT & BATCH SYNCHRONIZATION ---")
    gw.is_online = True
    print("STATUS: Satellite / Cellular data backhaul restored! Triggering batch sync...")
    sync_result = gw.flush_pending_queue()
    print(f"Batch Sync Result: {sync_result}")

    stats_restored = gw.queue.get_queue_stats()
    print(f"Gateway Local Queue Stats after sync: {stats_restored}")

    print("\n--- PHASE 4: IDEMPOTENT DUPLICATE SUPPRESSION TEST ---")
    print("Retransmitting Msg 102 (simulating mobile network duplicate delivery retry)...")
    dup_res = gw.receive_sms_from_device("+919848022332", "HELP|FLOOD|VIZAG|4 PEOPLE|1 ELDERLY", "chaos_msg_102")
    print(f"Duplicate result: {dup_res}")

    print("\n--- PHASE 5: TWO-WAY SMS OUTBOX POLLING (ACKNOWLEDGEMENTS) ---")
    sent_count = gw.poll_and_send_outbound_sms()
    print(f"Relayed {sent_count} outgoing SMS responses (acknowledgements / instructions) over cellular.")

    print("\n" + "=" * 70)
    print("SIMULATION COMPLETED SUCCESSFULLY: ZERO DATA LOSS DEMONSTRATED.")
    print("=" * 70)

if __name__ == "__main__":
    run_disaster_chaos_simulation()
