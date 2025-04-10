from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import logging

from src.routes import ACTIVE_ROUTES
from src.resources.constants import ASTRELLECT_API_VERSION
from src.database import models
from src.database import engine

models.Base.metadata.create_all(bind=engine)

logger = logging.getLogger(__name__)

def _get_app():
    app = FastAPI(
        title="Astrellect API",
        description="API powered by Team Astrellect",
        version="1.0.0"
    )

    app.mount("/static", StaticFiles(directory="static"), name="static")
    templates = Jinja2Templates(directory="templates")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    for route in ACTIVE_ROUTES.values():
        app.include_router(route, prefix=ASTRELLECT_API_VERSION)

    return app
