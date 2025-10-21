from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Manages WebSocket connections for real-time transcription"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_connections: Dict[str, List[str]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        connection_id = f"{session_id}_{id(websocket)}"
        self.active_connections[connection_id] = websocket
        
        if session_id not in self.session_connections:
            self.session_connections[session_id] = []
        self.session_connections[session_id].append(connection_id)
        
        logger.info(f"WebSocket connected: {connection_id} for session: {session_id}")
    
    async def disconnect(self, session_id: str, connection_id: str = None):
        """Disconnect a WebSocket connection"""
        if connection_id:
            if connection_id in self.active_connections:
                del self.active_connections[connection_id]
            if session_id in self.session_connections:
                if connection_id in self.session_connections[session_id]:
                    self.session_connections[session_id].remove(connection_id)
                if not self.session_connections[session_id]:
                    del self.session_connections[session_id]
        else:
            # Disconnect all connections for a session
            if session_id in self.session_connections:
                for conn_id in self.session_connections[session_id]:
                    if conn_id in self.active_connections:
                        del self.active_connections[conn_id]
                del self.session_connections[session_id]
        
        logger.info(f"WebSocket disconnected for session: {session_id}")
    
    async def send_personal_message(self, message: dict, connection_id: str):
        """Send a message to a specific connection"""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {e}")
                await self.disconnect("", connection_id)
    
    async def send_to_session(self, session_id: str, message: dict):
        """Send a message to all connections in a session"""
        if session_id in self.session_connections:
            disconnected_connections = []
            for connection_id in self.session_connections[session_id]:
                if connection_id in self.active_connections:
                    websocket = self.active_connections[connection_id]
                    try:
                        await websocket.send_text(json.dumps(message))
                    except Exception as e:
                        logger.error(f"Error sending message to {connection_id}: {e}")
                        disconnected_connections.append(connection_id)
            
            # Clean up disconnected connections
            for conn_id in disconnected_connections:
                await self.disconnect(session_id, conn_id)
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all active connections"""
        disconnected_connections = []
        for connection_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to {connection_id}: {e}")
                disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for conn_id in disconnected_connections:
            if conn_id in self.active_connections:
                del self.active_connections[conn_id]