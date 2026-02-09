import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { createOrder } from "../services/order.services";
import { OrderCreatedPayload, OrderData } from "../types/Order";
import { sendToMerchant } from "../helpers/merchant.helper";

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

  ws.on("message", async (data) => {
    const message: OrderCreatedPayload = JSON.parse(data.toString());

    switch (message.type) {
      case "order.created":
        const order = await createOrder(message);

        if (order.status === 'success') {
          ws.send(JSON.stringify({
            type: 'order.created',
            data: order
          }));

          const orderData = order.data as OrderData;
          // notify merchant
          sendToMerchant(orderData.merchantId, {
            type: 'order.created.success',
            data: order.data
          });

          const backendSocket = socketRegistry.get(backendSocketId);
          console.log(backendSocketId);
          if (backendSocket) {
            backendSocket.send(JSON.stringify({
              type: 'order.created.success',
              data: order.data
            }));
          }

        } else {
          ws.send(JSON.stringify({
            type: 'order.error',
            data: order
          }));
        }
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  });

  ws.on("close", () => {
    socketRegistry.delete(ws.id);
  });

  ws.on("error", (err) => {
    console.error("Backend socket error:", err.message);
  });
});