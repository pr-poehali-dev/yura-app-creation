const ORDERS_URL = 'https://functions.poehali.dev/a355ad1e-ba4f-453b-90c3-54e7a02ade2d';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  selectedSize: string;
}

export interface Order {
  id?: number;
  user_id?: number;
  items: OrderItem[];
  total_amount: number;
  delivery_address?: string;
  delivery_phone?: string;
  payment_method?: string;
  status?: string;
  created_at?: string;
}

export const ordersApi = {
  async createOrder(order: Order): Promise<{ order_id: number; created_at: string; status: string }> {
    const response = await fetch(ORDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create order');
    }
    
    return await response.json();
  },

  async getOrders(userId?: number): Promise<Order[]> {
    const url = userId ? `${ORDERS_URL}?user_id=${userId}` : ORDERS_URL;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    return await response.json();
  },

  async getOrder(orderId: number): Promise<Order> {
    const response = await fetch(`${ORDERS_URL}?order_id=${orderId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    
    return await response.json();
  },

  async updateOrderStatus(orderId: number, status: string): Promise<void> {
    const response = await fetch(ORDERS_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, status })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
  }
};
