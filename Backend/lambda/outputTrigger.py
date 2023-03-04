import json
import boto3
import ast
import uuid
import os

stateARN = os.environ['STEPFUNCTION_ARN']

print('Loading function')

step_function = boto3.client('stepfunctions')

def handler(event, context):
    
    #state machine id
    state_id = str(uuid.uuid1())
    value1 = {
        "id": state_id,
    }
    
    
    response = step_function.start_execution(
            stateMachineArn= stateARN,
            name = state_id,
            input = json.dumps(value1)
        )