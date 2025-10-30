'''
Business: Manage orders - create, read, update status
Args: event with httpMethod, body with order data or query params
Returns: HTTP response with order data or list of orders
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
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    path = event.get('params', {}).get('path', '')
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        items = body.get('items', [])
        total_amount = body.get('total_amount')
        delivery_address = body.get('delivery_address')
        delivery_phone = body.get('delivery_phone')
        payment_method = body.get('payment_method', 'card')
        
        if not items or not total_amount:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Items and total_amount required'}),
                'isBase64Encoded': False
            }
        
        cursor.execute(
            """INSERT INTO orders (user_id, total_amount, delivery_address, delivery_phone, payment_method, status) 
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at""",
            (user_id, total_amount, delivery_address, delivery_phone, payment_method, 'pending')
        )
        order = cursor.fetchone()
        order_id = order['id']
        
        for item in items:
            cursor.execute(
                """INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, selected_size)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (order_id, item.get('id'), item.get('name'), item.get('price'), item.get('quantity'), item.get('selectedSize'))
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'order_id': order_id,
                'created_at': order['created_at'].isoformat() if order['created_at'] else None,
                'status': 'pending'
            }),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        query_params = event.get('queryStringParameters', {}) or {}
        user_id = query_params.get('user_id')
        order_id = query_params.get('order_id')
        
        if order_id:
            cursor.execute(
                """SELECT o.*, 
                   json_agg(json_build_object(
                       'id', oi.id,
                       'product_name', oi.product_name,
                       'product_price', oi.product_price,
                       'quantity', oi.quantity,
                       'selected_size', oi.selected_size
                   )) as items
                   FROM orders o
                   LEFT JOIN order_items oi ON o.id = oi.order_id
                   WHERE o.id = %s
                   GROUP BY o.id""",
                (order_id,)
            )
            order = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if order:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(order), default=str),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Order not found'}),
                    'isBase64Encoded': False
                }
        
        if user_id:
            cursor.execute(
                """SELECT o.*, 
                   json_agg(json_build_object(
                       'id', oi.id,
                       'product_name', oi.product_name,
                       'product_price', oi.product_price,
                       'quantity', oi.quantity,
                       'selected_size', oi.selected_size
                   )) as items
                   FROM orders o
                   LEFT JOIN order_items oi ON o.id = oi.order_id
                   WHERE o.user_id = %s
                   GROUP BY o.id
                   ORDER BY o.created_at DESC""",
                (user_id,)
            )
        else:
            cursor.execute(
                """SELECT o.*, u.email as user_email, u.full_name as user_name,
                   json_agg(json_build_object(
                       'id', oi.id,
                       'product_name', oi.product_name,
                       'product_price', oi.product_price,
                       'quantity', oi.quantity,
                       'selected_size', oi.selected_size
                   )) as items
                   FROM orders o
                   LEFT JOIN users u ON o.user_id = u.id
                   LEFT JOIN order_items oi ON o.id = oi.order_id
                   GROUP BY o.id, u.email, u.full_name
                   ORDER BY o.created_at DESC"""
            )
        
        orders = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps([dict(order) for order in orders], default=str),
            'isBase64Encoded': False
        }
    
    if method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        order_id = body.get('order_id')
        status = body.get('status')
        
        if not order_id or not status:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'order_id and status required'}),
                'isBase64Encoded': False
            }
        
        cursor.execute(
            "UPDATE orders SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, status",
            (status, order_id)
        )
        order = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        if order:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'order': dict(order)}),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Order not found'}),
                'isBase64Encoded': False
            }
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Not found'}),
        'isBase64Encoded': False
    }
