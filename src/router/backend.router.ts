import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";

interface BackendSocket extends WebSocket {
  id: string;
}

export const backendWSS = new WebSocketServer({
  noServer: true,
});

export const socketRegistry = new Map<string, BackendSocket>();
export let backendSocketId = "";

backendWSS.on("connection", (ws: BackendSocket, req) => {
  if (!req.url) return ws.close(1008, "Missing URL");
  const headerId = req.headers["id"];

  let socketId: string | undefined;

  if (typeof headerId === "string") {
    socketId = headerId;
  } else if (Array.isArray(headerId)) {
    socketId = headerId[0];
  }

  ws.id = socketId ?? uuidv4();
  backendSocketId = ws.id;
  console.log("backend connected on", ws.id);

  socketRegistry.set(ws.id, ws);

  ws.on("message", (data) => {
    console.log("📩 Backend message:", data.toString());
  });

  ws.on("close", () => {
    console.log("❌ Backend disconnected");
  });

  ws.on("error", (err) => {
    console.error("Backend socket error:", err.message);
  });

  ws.send(JSON.stringify({ type: "connected", role: "backend" }));
});
