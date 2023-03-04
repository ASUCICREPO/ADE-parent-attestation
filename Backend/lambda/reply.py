import json
import boto3
import os

tableName = os.environ['TABLE_NAME']

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(tableName)

def handler(event, context):
    
    #print(event)
    #print(json.dumps(event))
    
    all_data = scan_data_table()
    
    data = event['Records'][0]['Sns']
    #print("this is extraxted data /n")
    #print(data)
    
    real_val_data = json.loads(data['Message'])
    print(real_val_data)
    print(type(real_val_data))
    print(json.dumps(real_val_data))
    
    phone_num = real_val_data['originationNumber']
    previousPublishedMessageId = real_val_data['previousPublishedMessageId']
    inboundMessageId = real_val_data['inboundMessageId']
    reply = real_val_data['messageBody']
    print(phone_num)
    print(reply)
    print(previousPublishedMessageId)
    print(inboundMessageId)
    
    for item in all_data:
        print("this is the item")
        print(item)
        print(item['messageId'])
        if item['messageId'] == previousPublishedMessageId:
            userId = item['id']
            table.update_item(
                Key={'id': userId},
                UpdateExpression="SET reply= :s",
                ExpressionAttributeValues={':s': reply},
                ReturnValues="UPDATED_NEW"
                )
 

def scan_data_table():
    
    response = table.scan()
    all_prep_data = response['Items']
    
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        all_prep_data.extend(response['Items'])
    
    return all_prep_data 