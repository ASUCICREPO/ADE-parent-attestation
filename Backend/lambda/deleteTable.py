import json
import boto3
import os

tableName = os.environ['TABLE_NAME']

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(tableName)

def handler(event, context):
    
    value = table.delete()
    
    return {
        'statusCode': 200,
        'body': value
    }
