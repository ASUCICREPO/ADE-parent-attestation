import json
import boto3
from datetime import datetime
import os
import dateutil.tz

tableName = os.environ['TABLE_NAME']

dynamodb = boto3.resource('dynamodb')

s3 = boto3.client('s3')


def handler(event, context):
    
    print(json.dumps(event))
    
    bucket = event['value']['bucket']['name']
    key_1 = event['value']['object']['key']
    
    json_file = event['value']['object']['key']
    
    print('file uploaded name:' + json_file)
    
    json_object = s3.get_object(Bucket = bucket, Key = json_file)
    
    print('Json Object received:')
    print( json_object)

    #reading file by decoding it
    file_read = json_object['Body'].read().decode("utf-")
    file_read = json.loads(file_read)
    
    print("This is the file read:")
    print("/n")
    print(json.dumps(file_read))
    print(type(file_read))
    print("This is the new type read:")
    print(file_read)
    print(type(file_read))
    
    table = dynamodb.Table(tableName)
    
    #the timezone that should be used when calling datetime
    phx_timeZone =  dateutil.tz.gettz("America/Phoenix")
    phx_time = datetime.now(tz=phx_timeZone)
    
    #today's date is the attribute used to form the date used to filter data
    todays_date = format_date(phx_time)
    
    for item in file_read:
        Id = key_1
        channelType = item['ChannelType']
        address = item['Address']
        location = item['Location']['Country']
        userId = item['User']['UserId']
        
        data = {
        "id": userId,
        "channelType": channelType,
        "address": address,
        "location": location,
        "userId": userId,
        "DateCreated": todays_date,
        }
        #print(data)
        table.put_item(Item =  data)


    return {
        'statusCode': 200,
        'body': 'Success',
        'data': file_read
    }
    
def format_date(date_object):

    formatted_date = date_object.strftime('%Y-%m-%d')

    return formatted_date
    
    
