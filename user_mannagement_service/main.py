from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.v1 import auth, protected,owners,farms,sub_user

#NB FRANC I REMOVED ROW LEVEL SECURITY ON CONSULTATIONS TABLE TO ALLOW INSERTS WITHOUT AUTH FOR BOOKING CONSULTATIONS. THIS IS NOT RECOMMENDED FOR PRODUCTION. IN PRODUCTION, WE SHOULD IMPLEMENT A SECURE WAY TO ALLOW CONSULTATION BOOKINGS WITHOUT COMPROMISING SECURITY.
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
app.include_router(owners.router, prefix=settings.API_V1_PREFIX)
app.include_router(farms.router, prefix=settings.API_V1_PREFIX)
app.include_router(sub_user.router, prefix=settings.API_V1_PREFIX)
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
    uvicorn.run("user_mannagement_service.main:app", host="0.0.0.0", port=8001, reload=settings.DEBUG)