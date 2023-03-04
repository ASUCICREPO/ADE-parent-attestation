import json
import boto3
from datetime import datetime
import dateutil.tz
import os

tableName = os.environ['TABLE_NAME']
bucketName = os.environ['BUCKET_NAME']

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(tableName)
s3 = boto3.client('s3')


def handler(event, context):
    # TODO implement
    val = event['id']
    print(val)
    #the timezone that should be used when calling datetime
    phx_timeZone =  dateutil.tz.gettz("America/Phoenix")
    phx_time = datetime.now(tz=phx_timeZone)
    
    #all data is all of data from dynamodb table
    all_data = scan_data_table()
    
    #today's date is the attribute used to form the date used to filter data
    todays_date = format_date(phx_time)
    todays_Date1 = format_date(phx_time)
    
    #Final data after filtering to be used in the file creation in s3 bucket
    Compared_data = real_data(all_data, todays_date)
    print("This is compared data")
    print(json.dumps(Compared_data))
    
    value1 = {
        "data": write_to_s3(Compared_data, todays_Date1),
        "id": val
    }
    response = value1
    
    return response

    
def scan_data_table():
    
    response = table.scan()
    all_prep_data = response['Items']
    
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        all_prep_data.extend(response['Items'])
    
    return all_prep_data
   

# Return a date with format YYYY-MM-DD   
def format_date(date_object):
    
    formatted = date_object.strftime('%Y-%m-%d')
    
    return formatted
    
def real_data(all_data, todays_date):
    data_rows = []
    i = 0
    for item in all_data:
        if item['DateCreated'] == todays_date:
            data_rows.append(item)
        i = i + 1 
        
    return  data_rows  
    
    
def write_to_s3(Compared_data, todays_Date1):
    
    response = s3.put_object(
        Bucket = bucketName,
        Body = json.dumps(Compared_data).encode('UTF-8'),
        Key = f'{todays_Date1}.json'
        )