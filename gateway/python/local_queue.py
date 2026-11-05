import sqlite3
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

class GatewayLocalQueue:
    """
    Disaster-resilient persistent SQLite storage running locally on the Gateway device.
    Caches SMS messages when cellular or internet uplink is down.
    """
    def __init__(self, db_path: str = "gateway_local.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        # Outbox: Inbound cellular SMS waiting to be synced to central backend
        cur.execute("""
            CREATE TABLE IF NOT EXISTS local_inbound_queue (
                id TEXT PRIMARY KEY,
                sender TEXT NOT NULL,
                text TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                sync_status TEXT DEFAULT 'PENDING', -- PENDING, SYNCED, FAILED
                retry_count INTEGER DEFAULT 0,
                last_retry TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # Outbox for cellular transmission: Messages from backend to send via cellular SIM
        cur.execute("""
            CREATE TABLE IF NOT EXISTS local_outbound_queue (
                id TEXT PRIMARY KEY,
                phone TEXT NOT NULL,
                message TEXT NOT NULL,
                send_status TEXT DEFAULT 'QUEUED', -- QUEUED, SENT, FAILED
                retry_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                sent_at TEXT
            )
        """)

        conn.commit()
        conn.close()

    def enqueue_inbound_sms(self, sender: str, text: str, msg_id: Optional[str] = None) -> str:
        unique_id = msg_id or f"gw_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow().isoformat()
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute("""
            INSERT OR IGNORE INTO local_inbound_queue (id, sender, text, timestamp, sync_status, retry_count, created_at)
            VALUES (?, ?, ?, ?, 'PENDING', 0, ?)
        """, (unique_id, sender, text, now, now))
        conn.commit()
        conn.close()
        return unique_id

    def get_pending_inbound(self, limit: int = 50) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("""
            SELECT id, sender, text, timestamp, retry_count
            FROM local_inbound_queue
            WHERE sync_status = 'PENDING'
            ORDER BY created_at ASC
            LIMIT ?
        """, (limit,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def mark_inbound_synced(self, msg_ids: List[str]):
        if not msg_ids:
            return
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.executemany("""
            UPDATE local_inbound_queue
            SET sync_status = 'SYNCED'
            WHERE id = ?
        """, [(mid,) for mid in msg_ids])
        conn.commit()
        conn.close()

    def record_sync_failure(self, msg_ids: List[str]):
        now = datetime.utcnow().isoformat()
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.executemany("""
            UPDATE local_inbound_queue
            SET retry_count = retry_count + 1, last_retry = ?
            WHERE id = ?
        """, [(now, mid) for mid in msg_ids])
        conn.commit()
        conn.close()

    def get_queue_stats(self) -> Dict[str, int]:
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM local_inbound_queue WHERE sync_status = 'PENDING'")
        pending = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM local_inbound_queue WHERE sync_status = 'SYNCED'")
        synced = cur.fetchone()[0]
        conn.close()
        return {"pending_sync": pending, "synced_total": synced}
