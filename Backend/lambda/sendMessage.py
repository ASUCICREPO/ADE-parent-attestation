import json
import boto3
import os

tableName = os.environ['TABLE_NAME']
pinpointId = os.environ['PINPOINT_APP_ID']
originNumber = os.environ['ORIGINATION_NUM']

pinpoint = boto3.client('pinpoint')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(tableName)

def handler(event, context):

    data = event['data']
    val_rows = []
    user_id_rows = []
    all_data = scan_data_table()
    
    for item in data:
        destin_num = item['Address']
        message = item['Message']
        val = (send_sms_message(destin_num, message))
        val_rows.append(val)

            
    return {
        'statusCode': 200,
        'body': val_rows
    }


def send_sms_message(destin_num, message):
    
    response = pinpoint.send_messages(
        ApplicationId = pinpointId,
            MessageRequest={
                'Addresses': {destin_num: {'ChannelType': 'SMS'}},
                'MessageConfiguration': {
                    'SMSMessage': {
                        'Body': message,
                        'MessageType': "PROMOTIONAL",
                        'OriginationNumber': originNumber}
                        }
                    }
                )
                
    return response            
    
    
def scan_data_table():
    
    response = table.scan()
    all_prep_data = response['Items']
    
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        all_prep_data.extend(response['Items'])
    
    return all_prep_data