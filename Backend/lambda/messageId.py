import json
import boto3
import os

tableName = os.environ['TABLE_NAME']

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(tableName)


def handler(event, context):
    
    data = event['body']
    
    all_data = scan_data_table()
    print(all_data)
    
    
    for item in data:
        phone_id = item['MessageResponse']['Result'].keys()
        phn_id = json.dumps(list(phone_id))
        phone_id_load = json.loads(phn_id)
        #phone_id_dumped = json.dumps(phone_id_load)
        
        #rint("this is the phone no id from event")
        #rint(type(phone_id_load))
        
        #rint(phone_id_load[0])
        
        
        msg_id_key = item['MessageResponse']['Result'].values()
        msg_id = json.dumps(list(msg_id_key))
        final_msg_id = json.loads(msg_id)
        fn = final_msg_id[0]['MessageId']
        #rint("this is the message_id from event")
        #rint(fn)
        
        print("Now calling filtered data")
        filtered_data = real_data(all_data, phone_id_load)
        print(json.dumps(filtered_data))
        
        for item in filtered_data:
            userId = item['userId']
            
            table.update_item(
                Key={'id': userId},
                UpdateExpression="SET messageId= :s",
                ExpressionAttributeValues={':s': fn},
                ReturnValues="UPDATED_NEW"
                )

    
    return {
        'statusCode': 200,
        'body': "Success"
    }


def scan_data_table():
    
    response = table.scan()
    all_prep_data = response['Items']
    
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        all_prep_data.extend(response['Items'])
    
    return all_prep_data
    
def real_data(all_data, phn_id):
    data_rows = []
    i = 0
    for item in all_data:
        if item['address'] == phn_id[0]:
            data_rows.append(item)
        i = i + 1 
        
    return  data_rows 