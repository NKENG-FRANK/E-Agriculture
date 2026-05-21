from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from user_mannagement_service.core.config import settings
from user_mannagement_service.api.v1 import auth, protected

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(protected.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "api_prefix": settings.API_V1_PREFIX
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("user_mannagement_service.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)