import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "./")))

from sqlalchemy import inspect
from src.database import engine

def check_database():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if not tables:
        print("❌ No tables found in the database!")
        return
    
    print(f"✅ Found {len(tables)} tables in the database:")
    for table in tables:
        print(f"  - {table}")
        columns = inspector.get_columns(table)
        print(f"    Columns: {', '.join(col['name'] for col in columns)}")

if __name__ == "__main__":
    check_database()