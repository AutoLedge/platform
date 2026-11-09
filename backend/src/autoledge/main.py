from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from autoledge.api.routes import health, me
from autoledge.core.config import settings

app = FastAPI(title="Autoledge API")

# Let the frontend call the API from the browser. Origins come from settings
# (CORS_ORIGINS: the Vite dev server by default; the deployed frontend in
# production). Auth is a Bearer token in the Authorization header, not
# cookies, so credentials stay off and Authorization is an allowed header.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=False,
    max_age=600,  # browsers may cache a preflight answer for 10 minutes
)

app.include_router(health.router)
app.include_router(me.router)
