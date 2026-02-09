import "dotenv/config";
import http from "http";
import { Socket } from "net";
import { WebSocket } from "ws";
import crypto from "crypto";
import orderWSS from "./router/order.router";
import merchantWSS from "./router/merchant.router";
import { backendWSS } from "./router/backend.router";
import { connectDB } from "./utils/database";
import "./models";

const PORT = Number(process.env.PORT) || 4000;
const SOCKET_KEY = process.env.SOCKET_KEY!;

function reject(socket: Socket, code = 401, msg = "Unauthorized") {
  socket.write(`HTTP/1.1 ${code} ${msg}\r\n\r\n`);
  socket.destroy();
}

function connectionPayload(role: string) {
  return JSON.stringify({
    status: "connected",
    role,
    connectionId: crypto.randomUUID(),
    serverTime: Date.now()
  });
}

function validateParams(
  url: URL,
  allowed: string[]
): boolean {
  for (const key of url.searchParams.keys()) {
    if (!allowed.includes(key)) return false;
  }
  return true;
}

interface AppWebSocket extends WebSocket {
  route?: string;
  merchantId?: string;
  customerId?: string;
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`WebSocket server running on ws://localhost:${PORT}`);
});

server.on("upgrade", (req, socket: Socket, head) => {
  try {
    if (!req.url) return reject(socket);
    const origin =
      process.env.NODE_ENV === "development"
        ? "http://localhost:4000"
        : `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

    const url = new URL(req.url, origin);
    const path = url.pathname;
    const key = url.searchParams.get("key");
    if (key !== SOCKET_KEY) return reject(socket);
    if (path === "/c/api") {
      if (!validateParams(url, ["key"])) {
        return reject(socket, 400, "Unexpected params");
      }
      backendWSS.handleUpgrade(req, socket, head, ws => {
        const appWs = ws as AppWebSocket;
        appWs.route = "api";
        ws.send(connectionPayload("api"));
        backendWSS.emit("connection", appWs, req);
      });

      return;
    }

    if (path === "/c/merchant") {
      if (!validateParams(url, ["key", "id"])) {
        return reject(socket, 400, "Unexpected params");
      }
      const merchantId = url.searchParams.get("id");
      if (!merchantId) return reject(socket, 400, "Missing id");
      merchantWSS.handleUpgrade(req, socket, head, ws => {
        const appWs = ws as AppWebSocket;
        appWs.route = "merchant";
        appWs.merchantId = merchantId;
        ws.send(connectionPayload("merchant"));
        merchantWSS.emit("connection", appWs, req);
      });
      return;
    }
    if (path === "/c/customer") {
      if (!validateParams(url, ["key", "id"])) {
        return reject(socket, 400, "Unexpected params");
      }
      const customerId = url.searchParams.get("id");
      if (!customerId) return reject(socket, 400, "Missing id");
      orderWSS.handleUpgrade(req, socket, head, ws => {
        const appWs = ws as AppWebSocket;
        appWs.route = "customer";
        appWs.customerId = customerId;
        ws.send(connectionPayload("customer"));
        orderWSS.emit("connection", appWs, req);
      });
      return;
    }
    reject(socket, 404, "Not Found");
  } catch {
    reject(socket);
  }
});

async function start() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("Startup failed:", err);
  process.exit(1);
});
