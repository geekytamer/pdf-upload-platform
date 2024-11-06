from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import os

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/upload"):
            auth_token = request.headers.get("Authorization")
            if auth_token != os.getenv("ADMIN_TOKEN"):
                raise HTTPException(status_code=403, detail="Unauthorized")
        return await call_next(request)