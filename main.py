
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AvizorChart Engine",
    description="Backend analítico con agentes IA para AvizorChart",
    version="1.0.0"
)

# CORS: Indispensable para que tu web en Framer pueda consultar la API sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def estado_servidor():
    return {
        "sistema": "AvizorChart",
        "estado": "operativo",
        "version": "1.0.0"
    }
