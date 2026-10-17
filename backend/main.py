from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.screener import router as screener_router

app = FastAPI(
    title="AvizorChart Engine",
    description="Backend analítico con agentes IA para AvizorChart",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conectar rutas de screener y agentes
app.include_router(screener_router)

@app.get("/")
def estado_servidor():
    return {
        "sistema": "AvizorChart",
        "estado": "operativo",
        "version": "1.0.0"
    }