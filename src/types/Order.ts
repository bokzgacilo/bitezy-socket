export interface OrderItemPayload {
  menuId: number;
  qty: number;
  notes: string | null;
}

export interface ClientPayload {
  id: string;
  pax_size: number;
  seat: string;
}

export interface OrderCreatedPayload {
  type: 'order.created';
  requestId: string;
  merchantId: string;
  client: ClientPayload;
  items: OrderItemPayload[];
}

export interface OrderData {
  merchantId: number;
  status: string;
}