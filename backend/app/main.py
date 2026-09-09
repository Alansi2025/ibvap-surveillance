"""
IBVAP - Intelligent Border Video Analytics Platform
Main Application Server (FastAPI + WebSockets)
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.routes import router as api_router, pipeline_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("IBVAP.Main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing IBVAP Database & Surveillance Infrastructure...")
    init_db()
    
    pipeline_manager.event_loop = asyncio.get_running_loop()
    pipeline_manager.initialize_cameras()
    logger.info("IBVAP Vision & Behavioral Pipelines Activated Successfully!")
    
    yield
    
    logger.info("Shutting down IBVAP pipelines safely...")
    pipeline_manager.shutdown_all()
    logger.info("Shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Software-defined AI video analytics platform for border surveillance CCTV infrastructure.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API under both /api and /api/v1 for universal backward compatibility
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")


# Real-time WebSocket connection hubs
@app.websocket("/ws/live")
@app.websocket("/ws/alerts")
async def websocket_live_feed(websocket: WebSocket):
    await websocket.accept()
    pipeline_manager.websocket_clients.add(websocket)
    logger.info("Tactical Dashboard Client connected to WebSocket. Total: %d", len(pipeline_manager.websocket_clients))
    
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "HEARTBEAT", "status": "ONLINE", "time": asyncio.get_event_loop().time()})
    except WebSocketDisconnect:
        pipeline_manager.websocket_clients.discard(websocket)
    except Exception:
        pipeline_manager.websocket_clients.discard(websocket)


@app.get("/")
def health_check():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "active_pipelines": len(pipeline_manager.pipelines)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=False)
