import os
from pathlib import Path


API_VERSION_CONTROLLER = "v1"
ASTRELLECT_API_VERSION = f"/astrellect/{API_VERSION_CONTROLLER}"


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SORS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(SORS_DIR, "static")
TEMPLATES_DIR = os.path.join(SORS_DIR, "templates")
DATABASE_DIR = os.path.join(PROJECT_ROOT, "database")

if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)
if not os.path.exists(TEMPLATES_DIR):
    os.makedirs(TEMPLATES_DIR)
if not os.path.exists(DATABASE_DIR):
    os.makedirs(DATABASE_DIR)

DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'astrellect.db')}"
