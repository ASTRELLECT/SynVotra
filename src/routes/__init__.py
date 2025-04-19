from src.routes.pages import pages_router
from src.routes.users import users_router
from src.routes.admin import admin_router
# from src.routes.testimonials import testimonials_router

ACTIVE_ROUTES = {
    "pages": pages_router,
    "users": users_router,
    "admin": admin_router
    # "testimonials": testimonials_router,
}

ACTIVE_ROUTES = dict(sorted(ACTIVE_ROUTES.items()))