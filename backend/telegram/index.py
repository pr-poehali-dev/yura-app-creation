'''
Business: Send Telegram notifications about new orders and link Telegram accounts
Args: event with httpMethod, body with order details or telegram linking data
Returns: HTTP response with success status
'''

import json
import os
import requests
from typing import Dict, Any

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
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
            'body': json.dumps({'error': 'Telegram bot not configured'}),
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters', {}) or {}
    raw_path = event.get('requestContext', {}).get('http', {}).get('path', '')
    if not raw_path:
        raw_path = query_params.get('path', '')
    
    path = ''
    if '/notify-order' in raw_path:
        path = '/notify-order'
    elif '/link-account' in raw_path:
        path = '/link-account'
    
    if method == 'POST' and path == '/notify-order':
        body = json.loads(event.get('body', '{}'))
        order_id = body.get('order_id')
        user_name = body.get('user_name', 'Гость')
        total_amount = body.get('total_amount', 0)
        items = body.get('items', [])
        telegram_chat_id = body.get('telegram_chat_id')
        
        if not telegram_chat_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Telegram chat ID required'}),
                'isBase64Encoded': False
            }
        
        items_text = '\n'.join([
            f"• {item.get('name')} x{item.get('quantity')} - {item.get('price')} ₽"
            for item in items
        ])
        
        message = f"""
🛍 Новый заказ #{order_id}

👤 Клиент: {user_name}
💰 Сумма: {total_amount:,.0f} ₽

📦 Товары:
{items_text}

Перейдите в админ-панель для обработки заказа.
        """.strip()
        
        telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        response = requests.post(telegram_url, json={
            'chat_id': telegram_chat_id,
            'text': message,
            'parse_mode': 'HTML'
        })
        
        if response.status_code == 200:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Notification sent'}),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Failed to send notification', 'details': response.text}),
                'isBase64Encoded': False
            }
    
    if method == 'POST' and path == '/link-account':
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        telegram_id = body.get('telegram_id')
        telegram_username = body.get('telegram_username')
        
        if not database_url or not user_id or not telegram_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            "UPDATE users SET telegram_id = %s, telegram_username = %s WHERE id = %s RETURNING id, email, telegram_id, telegram_username",
            (telegram_id, telegram_username, user_id)
        )
        user = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        if user:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'user': dict(user)}),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Not found'}),
        'isBase64Encoded': False
    }