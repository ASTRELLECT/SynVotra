from src.routes.users import users_router
from src.routes.auth import auth_router
from src.routes.testimonials import testimonials_router
from src.routes.announcement import announcement_router
from src.routes.companyPolicy import policy_router

ACTIVE_ROUTES = {
    "users": users_router,
    "auth": auth_router,
    "testimonials": testimonials_router,
    "announcement": announcement_router,
    "policy": policy_router

}

ACTIVE_ROUTES = dict(sorted(ACTIVE_ROUTES.items()))