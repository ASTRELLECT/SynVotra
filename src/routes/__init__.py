from src.routes.users import users_router
from src.routes.auth import auth_router
from src.routes.testimonials import testimonials_router
<<<<<<< HEAD
from src.routes.announcement import announcement_router
=======
from src.routes.companyPolicy import policy_router
>>>>>>> 6c9d77506846e0c5a2a854c055a0c3dcd4763eae

ACTIVE_ROUTES = {
    "users": users_router,
    "auth": auth_router,
    "testimonials": testimonials_router,
<<<<<<< HEAD
    "announcement": announcement_router
=======
    "company policies": policy_router,
>>>>>>> 6c9d77506846e0c5a2a854c055a0c3dcd4763eae
}

ACTIVE_ROUTES = dict(sorted(ACTIVE_ROUTES.items()))