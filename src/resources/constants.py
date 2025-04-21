import os
from pathlib import Path


API_VERSION_CONTROLLER = "v1"
ASTRELLECT_API_VERSION = f"/astrellect/{API_VERSION_CONTROLLER}"


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


SORS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(PROJECT_ROOT, "static")
TEMPLATES_DIR = os.path.join(PROJECT_ROOT, "templates")
DATABASE_DIR = os.path.join(PROJECT_ROOT, "database")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
AVATARS_DIR = os.path.join(UPLOADS_DIR  , "avatars")
AVATARS_1 = os.path.join(AVATARS_DIR, "avatar1.png")
AVATARS_2 = os.path.join(AVATARS_DIR, "avatar2.png")

if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)
if not os.path.exists(TEMPLATES_DIR):
    os.makedirs(TEMPLATES_DIR)
if not os.path.exists(DATABASE_DIR):
    os.makedirs(DATABASE_DIR)
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)
if not os.path.exists(AVATARS_DIR):
    os.makedirs(AVATARS_DIR)
    
DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'astrellect.db')}"
