import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { Merchant } from "../models/merchant.model";

interface MerchantSocket extends WebSocket {
  merchantId: number;
  socketId: string;
}

const merchantWSS = new WebSocketServer({ noServer: true });

export const merchantConnections = new Map<number, MerchantSocket>();
const socketIndex = new Map<string, MerchantSocket>();

merchantWSS.on("connection", async (ws: MerchantSocket, req) => {
  try {
    if (!req.url) return ws.close(1008, "Missing URL");

    const url = new URL(req.url, "ws://127.0.0.1");
    const idParam = url.searchParams.get("id");

    const merchantId = Number(idParam);
    if (!idParam || Number.isNaN(merchantId)) return ws.close(1008, "Invalid merchant id");

    const merchantExists = await Merchant.findByPk(merchantId);
    if (!merchantExists) return ws.close(1008, "Merchant not found");

    ws.merchantId = merchantId;
    ws.socketId = uuidv4();

    console.log("merchant connected:", merchantId, ws.socketId);

    const connectedClient = {
      status: "connected",
      role: "merchant",
      merchantId,
      socketId: ws.socketId,
      serverTime: Date.now(),
      heartbeatInterval: 30000
    };

    ws.send(JSON.stringify(connectedClient));

    // replace old connection safely
    const existing = merchantConnections.get(merchantId);

    if (existing && existing !== ws) {
      try {
        existing.terminate(); // faster + avoids close race
      } catch { }
    }

    merchantConnections.set(merchantId, ws);
    socketIndex.set(ws.socketId, ws);

    ws.on("close", () => {
      const current = merchantConnections.get(merchantId);

      if (current === ws) merchantConnections.delete(merchantId);

      socketIndex.delete(ws.socketId);

      console.log("merchant disconnected:", merchantId, ws.socketId);
    });

    ws.on("error", err => {
      console.error("socket error:", err);
    });

  } catch (err) {
    console.error("connection handler error:", err);
    try { ws.close(1011, "Server error"); } catch { }
  }
});



export default merchantWSS;
