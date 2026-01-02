import json
import os
import base64
import boto3
from uuid import uuid4
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def upload_image_to_s3(image_data: str, filename: str) -> str:
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    image_bytes = base64.b64decode(image_data)
    key = f'articles/{uuid4()}_{filename}'
    
    s3.put_object(
        Bucket='files',
        Key=key,
        Body=image_bytes,
        ContentType='image/jpeg'
    )
    
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

def handler(event: dict, context) -> dict:
    '''API для управления статьями памятки полицейского'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            article_id = params.get('id')
            category = params.get('category')
            search = params.get('search')
            
            if article_id:
                cursor.execute('SELECT * FROM t_p18143168_police_reminder_app.articles WHERE id = %s', (article_id,))
                article = cursor.fetchone()
                if article:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps(dict(article), ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Article not found'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            query = 'SELECT * FROM t_p18143168_police_reminder_app.articles WHERE 1=1'
            query_params = []
            
            if category:
                query += ' AND category = %s'
                query_params.append(category)
            
            if search:
                query += ' AND (title ILIKE %s OR content ILIKE %s OR %s = ANY(tags))'
                search_pattern = f'%{search}%'
                query_params.extend([search_pattern, search_pattern, search])
            
            query += ' ORDER BY created_at DESC'
            
            cursor.execute(query, query_params)
            articles = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(a) for a in articles], ensure_ascii=False, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            title = data.get('title')
            content = data.get('content')
            category = data.get('category')
            tags = data.get('tags', [])
            image_data = data.get('image')
            filename = data.get('filename', 'image.jpg')
            
            if not all([title, content, category]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            image_url = None
            if image_data:
                image_url = upload_image_to_s3(image_data, filename)
            
            cursor.execute(
                'INSERT INTO t_p18143168_police_reminder_app.articles (title, content, category, tags, image_url) VALUES (%s, %s, %s, %s, %s) RETURNING *',
                (title, content, category, tags, image_url)
            )
            article = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(article), ensure_ascii=False, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            article_id = data.get('id')
            
            if not article_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Article ID is required'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            updates = []
            params = []
            
            if 'title' in data:
                updates.append('title = %s')
                params.append(data['title'])
            if 'content' in data:
                updates.append('content = %s')
                params.append(data['content'])
            if 'category' in data:
                updates.append('category = %s')
                params.append(data['category'])
            if 'tags' in data:
                updates.append('tags = %s')
                params.append(data['tags'])
            if 'image' in data and data['image']:
                image_url = upload_image_to_s3(data['image'], data.get('filename', 'image.jpg'))
                updates.append('image_url = %s')
                params.append(image_url)
            
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(article_id)
            
            query = f'UPDATE t_p18143168_police_reminder_app.articles SET {", ".join(updates)} WHERE id = %s RETURNING *'
            cursor.execute(query, params)
            article = cursor.fetchone()
            conn.commit()
            
            if article:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(article), ensure_ascii=False, default=str),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Article not found'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            article_id = params.get('id')
            
            if not article_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Article ID is required'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            cursor.execute('DELETE FROM t_p18143168_police_reminder_app.articles WHERE id = %s RETURNING id', (article_id,))
            deleted = cursor.fetchone()
            conn.commit()
            
            if deleted:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Article deleted successfully'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Article not found'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()