import { Transaction } from 'sequelize';
import { OrderCreatedPayload } from '../types/Order';
import { sequelize } from '../utils/database';

type CreateOrderResult =
  | { status: 'success'; data: unknown }
  | { status: 'error'; message: string };

export async function createOrder(
  payload: OrderCreatedPayload
): Promise<CreateOrderResult> {
  const { merchantId, client, items, requestId } = payload;

  if (!items?.length) {
    return { status: 'error', message: 'Order has no items' };
  }

  try {
    return await sequelize.transaction(async (t: Transaction) => {

      const order = await sequelize.models.Order.create(
        {
          merchantId,
          requestId: requestId,
          clientId: client.id,
          pax_size: client.pax_size,
          seat: client.seat,
          status: 'pending',
        },
        { transaction: t }
      );

      const orderItems = items.map(item => ({
        orderId: order.get('id') as number,
        menuId: item.menuId,
        qty: item.qty,
        notes: item.notes ?? null
      }));

      await sequelize.models.OrderItem.bulkCreate(orderItems, {
        transaction: t
      });

      return {
        status: 'success',
        data: order.get({ plain: true })
      };
    });

  } catch (err) {
    console.error('Create order failed:', err);

    return {
      status: 'error',
      message: 'Database error'
    };
  }
}
