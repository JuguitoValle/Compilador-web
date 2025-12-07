import uvicorn
import os

if __name__ == "__main__":
    print("🚀 Iniciando servidor en puerto 5000...")
    # CAMBIO IMPORTANTE: Port 5000 para coincidir con el Frontend
    uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)