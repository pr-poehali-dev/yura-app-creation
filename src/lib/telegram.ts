const TELEGRAM_API_URL = 'https://functions.poehali.dev/bd5b3b5c-3b73-4a7d-bcb7-913d02bf02a1';

export const telegramApi = {
  async linkAccount(userId: number, telegramId: number, telegramUsername: string): Promise<void> {
    const response = await fetch(`${TELEGRAM_API_URL}?path=/link-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        telegram_id: telegramId,
        telegram_username: telegramUsername
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to link Telegram account');
    }
  },

  async notifyOrder(orderId: number, userName: string, totalAmount: number, items: any[], telegramChatId: number): Promise<void> {
    const response = await fetch(`${TELEGRAM_API_URL}?path=/notify-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        user_name: userName,
        total_amount: totalAmount,
        items,
        telegram_chat_id: telegramChatId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send notification');
    }
  }
};
