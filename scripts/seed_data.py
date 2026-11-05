import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal
from backend.app.database.init_db import init_db, seed_initial_data

def main():
    print("Initializing RESQ-NET database tables...")
    init_db()
    db = SessionLocal()
    try:
        count = seed_initial_data(db)
        print(f"Successfully seeded database with sample disaster incidents and NDRF teams ({count} records).")
    finally:
        db.close()

if __name__ == "__main__":
    main()
