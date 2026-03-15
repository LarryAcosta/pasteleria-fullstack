from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings
from database import Base, engine
from routers import auth, clientes, pedidos, productos

# Leer configuración desde .env
settings = get_settings()

# Crear la aplicación FastAPI usando datos del .env
app = FastAPI(title=settings.app_name, debug=settings.debug)

# Crear las tablas en la base de datos (solo para desarrollo)
Base.metadata.create_all(bind=engine)

# CORS: importante para cuando el frontend esté separado (Next.js / Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos estáticos actuales (JS, CSS, etc.)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")


@app.get("/")
def read_root():
    return {"message": "API Pastelería funcionando", "env": settings.app_env}


@app.get("/app")
def get_frontend():
    return FileResponse("frontend/index.html")


# Incluir routers
app.include_router(auth.router)
app.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
app.include_router(productos.router, prefix="/productos", tags=["Productos"])
app.include_router(pedidos.router)
