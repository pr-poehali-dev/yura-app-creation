'''
Business: Telegram bot for user authentication and account linking with MAISON shop
Args: event with Telegram webhook updates
Returns: HTTP response with bot actions
'''

import json
import os
from typing import Dict, Any

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    database_url = os.environ.get('DATABASE_URL')
    
    if not bot_token:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Bot token not configured'}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        try:
            update = json.loads(event.get('body', '{}'))
            
            if 'message' not in update:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'ok': True}),
                    'isBase64Encoded': False
                }
            
            message = update['message']
            chat_id = message['chat']['id']
            telegram_id = message['from']['id']
            telegram_username = message['from'].get('username', '')
            text = message.get('text', '')
            
            if text == '/start':
                send_telegram_message(
                    bot_token,
                    chat_id,
                    f"👋 Добро пожаловать в MAISON!\n\n"
                    f"Ваш Telegram ID: `{telegram_id}`\n"
                    f"Username: @{telegram_username}\n\n"
                    f"Используйте кнопку 'Привязать Telegram' на сайте для связи аккаунтов.\n\n"
                    f"После привязки вы будете получать уведомления о ваших заказах здесь."
                )
            
            elif text == '/link':
                if not database_url:
                    send_telegram_message(bot_token, chat_id, "❌ Ошибка: база данных не настроена")
                    return build_response(200, {'ok': True})
                
                conn = psycopg2.connect(database_url)
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                cursor.execute(
                    "SELECT id, email, full_name FROM users WHERE telegram_id = %s",
                    (telegram_id,)
                )
                user = cursor.fetchone()
                cursor.close()
                conn.close()
                
                if user:
                    send_telegram_message(
                        bot_token,
                        chat_id,
                        f"✅ Ваш аккаунт уже привязан!\n\n"
                        f"Email: {user['email']}\n"
                        f"Имя: {user['full_name'] or 'Не указано'}\n\n"
                        f"Вы будете получать уведомления о заказах."
                    )
                else:
                    send_telegram_message(
                        bot_token,
                        chat_id,
                        f"📱 Привязка аккаунта\n\n"
                        f"Ваш Telegram ID: `{telegram_id}`\n\n"
                        f"Войдите на сайт MAISON и нажмите кнопку 'Привязать Telegram' в личном кабинете."
                    )
            
            elif text == '/help':
                send_telegram_message(
                    bot_token,
                    chat_id,
                    "📖 Доступные команды:\n\n"
                    "/start - Начало работы с ботом\n"
                    "/link - Привязка аккаунта\n"
                    "/help - Справка по командам\n\n"
                    "После привязки аккаунта вы будете получать уведомления о статусе ваших заказов."
                )
            
            else:
                send_telegram_message(
                    bot_token,
                    chat_id,
                    "❓ Неизвестная команда. Используйте /help для списка доступных команд."
                )
            
            return build_response(200, {'ok': True})
            
        except Exception as e:
            return build_response(500, {'error': str(e)})
    
    return build_response(404, {'error': 'Not found'})


def send_telegram_message(bot_token: str, chat_id: int, text: str):
    import requests
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    requests.post(url, json={
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'Markdown'
    })


def build_response(status_code: int, body: dict) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(body),
        'isBase64Encoded': False
    }
