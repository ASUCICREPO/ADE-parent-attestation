import json
import boto3
import os

tableName = os.environ['TABLE_NAME']

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(tableName)

def handler(event, context):
    
    value = create_table()
    
    return {
        'statusCode': 200,
        'body': value
    }

def create_table():
    
    table = dynamodb.create_table(
        TableName=tableName,
        KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'  #Partition key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'
                },
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 10,
                'WriteCapacityUnits': 10
            }
        )
    print("Table status:", table.table_status)