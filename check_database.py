#!/usr/bin/env python
"""
Script to check the database structure of the Astrellect API.
This script examines the SQLite database and prints information about
tables, columns, and row counts.
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "./")))

from sqlalchemy import inspect, text
from src.database import engine, SessionLocal

def check_database():
    """
    Check the database structure and print information
    """
    print("\n" + "="*80)
    print("ASTRELLECT DATABASE STRUCTURE CHECK")
    print("="*80)
    
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    if not table_names:
        print("\n❌ ERROR: No tables found in the database!")
        print("\nPlease make sure:")
        print("  1. The database file exists at: ./database/astrellect.db")
        print("  2. You've run initialization: python src/database/init_db.py")
        print("  3. You've applied migrations: alembic upgrade head")
        return
    
    print(f"\n✅ Found {len(table_names)} tables in the database:\n")
    
    # Get row counts for each table
    db = SessionLocal()
    row_counts = {}
    try:
        for table in table_names:
            result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
            row_counts[table] = result.scalar()
    finally:
        db.close()
    
    # Print table information
    for table_name in sorted(table_names):
        print(f"📋 TABLE: {table_name} ({row_counts.get(table_name, 0)} rows)")
        
        # Get primary key info
        pk_columns = [pk_column["name"] for pk_column in inspector.get_pk_constraint(table_name)["constrained_columns"]]
        
        # Get foreign key info
        fk_columns = {}
        for fk in inspector.get_foreign_keys(table_name):
            fk_columns[fk["constrained_columns"][0]] = {
                "referred_table": fk["referred_table"],
                "referred_column": fk["referred_columns"][0]
            }
        
        # Get column info
        columns = inspector.get_columns(table_name)
        print("    COLUMNS:")
        for column in columns:
            col_info = f"      - {column['name']}: {column['type']}"
            
            # Add additional info
            attributes = []
            if column["name"] in pk_columns:
                attributes.append("PRIMARY KEY")
            if not column["nullable"]:
                attributes.append("NOT NULL")
            if column["name"] in fk_columns:
                fk_info = fk_columns[column["name"]]
                attributes.append(f"FOREIGN KEY → {fk_info['referred_table']}({fk_info['referred_column']})")
            
            if attributes:
                col_info += f" [{', '.join(attributes)}]"
            
            print(col_info)
        
        print()  # Add empty line between tables
    
    # Check for alembic_version table
    if "alembic_version" in table_names:
        print("✅ Alembic migrations are set up correctly.")
        db = SessionLocal()
        try:
            result = db.execute(text("SELECT version_num FROM alembic_version"))
            current_version = result.scalar()
            print(f"   Current migration version: {current_version}")
        except Exception as e:
            print(f"   ⚠️ Couldn't retrieve current migration version: {e}")
        finally:
            db.close()
    else:
        print("⚠️ Alembic migrations table not found.")
        print("   Consider setting up migrations with: alembic init alembic")

if __name__ == "__main__":
    check_database()