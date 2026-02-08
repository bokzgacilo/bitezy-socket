// merchant.socket.ts

import { WebSocket } from "ws";
import { merchantConnections } from "../router/merchant.router";

export function sendToMerchant(
  merchantId: number,
  payload: unknown
) {
  const ws = merchantConnections.get(merchantId);

  if (!ws) {
    console.log('merchant offline:', merchantId);
    return false;
  }

  if (ws.readyState !== WebSocket.OPEN) {
    console.log('merchant socket not open:', merchantId);
    return false;
  }

  ws.send(JSON.stringify(payload));
  return true;
}
