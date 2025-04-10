from src.routes.pages import pages_router
from src.routes.users import users_router

ACTIVE_ROUTES = {
    "pages": pages_router,
    "users": users_router,
}

ACTIVE_ROUTES = dict(sorted(ACTIVE_ROUTES.items()))