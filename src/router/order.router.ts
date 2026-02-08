import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

import { createOrder } from '../services/order.services';
import { OrderCreatedPayload, OrderData } from '../types/Order';
import { sendToMerchant } from '../helpers/merchant.helper';
import { backendSocketId, socketRegistry } from './backend.router';

interface OrderSocket extends WebSocket {
  clientId: string;
}

const orderWSS = new WebSocketServer({ noServer: true });

orderWSS.on('connection', (ws: OrderSocket, req) => {
  ws.clientId = uuidv4();
  console.log('postman connected on', ws.clientId);

  ws.on('message', async (raw: Buffer) => {
    const message: OrderCreatedPayload = JSON.parse(raw.toString());

    try {
      const EVENT = {
        clientId: ws.clientId,
        ...message
      };

      switch (EVENT.type) {
        case 'order.created': {
          const order = await createOrder(EVENT);

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

          console.log(order);
          break;
        }

        default:
          console.log('Unknown event type:', EVENT.type);
      }

    } catch (error) {
      console.error('Message processing error:', error);

      ws.send(JSON.stringify({
        type: 'order.error',
        message: 'Invalid payload'
      }));
    }
  });

  ws.on('close', () => {
    console.log('Order socket disconnected:', ws.clientId);
  });
});

export default orderWSS;
