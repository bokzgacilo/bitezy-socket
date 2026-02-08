import "dotenv/config";
import http from "http";
import { Socket } from "net";
import orderWSS from "./router/order.router";
import merchantWSS from "./router/merchant.router";
import { connectDB } from "./utils/database";
import "./models";
import { backendWSS } from "./router/backend.router";

const PORT = Number(process.env.PORT) || 4000;

// empty HTTP server — only used for WS upgrade
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`WebSocket server running on ws://localhost:${PORT}`);
});

server.on(
  "upgrade",
  (req: http.IncomingMessage, socket: Socket, head: Buffer) => {
    const url = req.url ?? "";

    if (url.startsWith("/order")) {
      orderWSS.handleUpgrade(req, socket, head, (ws) => {
        orderWSS.emit("connection", ws, req);
      });
    } else if (url.startsWith("/merchant")) {
      merchantWSS.handleUpgrade(req, socket, head, (ws) => {
        merchantWSS.emit("connection", ws, req);
      });


    } else if (url === "/" || url === "") {
      backendWSS.handleUpgrade(req, socket, head, (ws) => {
        backendWSS.emit("connection", ws, req);
      });
    } else {
      socket.destroy(); // reject unknown routes
    }
  }
);

async function start() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
