import * as cdk from 'aws-cdk-lib';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import { aws_stepfunctions as stepfunctions } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

export interface CustomProps {

    dynamoTableName: string;  //dynamodb table name
    applicationId: string; // pinpoint application ID
    OriginationNum: string; // Origination number for the pinpoint project
    s3bucket: s3.Bucket // s3 bucket referenced

}

export class importstepLambda extends Construct {

    constructor(scope: Construct, id: string, props:CustomProps) {
      super(scope, id);

    // We first write the Lambda functions to be used in StepFunctions then define it and then the trigger Lambda function that 
    // is linked to S3 bucket for notifications

    //  This function is to read the initial message data from the S3 bucket file to the dynamo db table
    const write_initial_func = new lambda.Function(this, 'initial_message_data_func_cdk', 
    {
      functionName: 'write_table_func_cdk',
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'initialMessageData.handler',
      environment: {
        "TABLE_NAME": props.dynamoTableName
      }
    })

    //  Adding the required policies to the role of function to access the resources it needs
    write_initial_func.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:*",
          "dynamodb:*",
          "s3:*",
          "states:*"
        ],
        resources: ["*"],
      })
    )

    // This is the function to write reply of message sent to the dynamo db table
    //  We define its properties and reference to the folder with enviornment consisting of table name
    const writeReplyData = new lambda.Function(this, 'message_Id_func_cdk', 
    {
      functionName: 'writeReplyData',
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'messageId.handler',
      environment: {
        "TABLE_NAME": props.dynamoTableName
      }
    })

    //  Adding the required policies to the role of function to access the resources it needs
    writeReplyData.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:*",
          "dynamodb:*",
          "s3:*",
          "states:*"
        ],
        resources: ["*"],
      })
    )

    //  This function is to send messages using aws-pinpoint
    //  We define its properties and reference to the folder with enviornment consisting of table name, pinpoint app id, original number
    const send_message_func = new lambda.Function(this, 'send_message_func_cdk', 
    {
      functionName: 'send_message_func_cdk',
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'sendMessage.handler',
      environment: {
        "TABLE_NAME": props.dynamoTableName,
        "PINPOINT_APP_ID": props.applicationId,
        "ORIGINATION_NUM": props.OriginationNum
      }
    })

    //  Adding the required policies to the role of function to access the resources it needs
    send_message_func.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:*",
          "dynamodb:*",
          "s3:*",
          "mobiletargeting:*",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "states:*"
        ],
        resources: ["*"],
      })
    )

  // Defining the tasks in the stepfunctions workflow 
    // The steps are - 1)defining tasks, 2)declaring the workflow by creating a Statemachine

    // workflow task1 to write the Initial data from S3 to dynamodb
    const write_initial = new tasks.LambdaInvoke(this, 'write_initial', 
    {
      lambdaFunction: write_initial_func,
      // Payload defines the input that the task will get here it is taking all the input from the Trigger function
      payload: stepfunctions.TaskInput.fromJsonPathAt('$'),
    }
    )

    // workflow task 2 to send messages 
    const send_message = new tasks.LambdaInvoke(this, 'send_message', 
    {
      lambdaFunction: send_message_func,
      // Payload defines the input that the task will get here it is output from previous tasks
      payload: stepfunctions.TaskInput.fromJsonPathAt('$.Payload'),
    }
    )

    // workflow task 3 to write message id to dynamodb
    const writeMessageId = new tasks.LambdaInvoke(this, 'writeMessageId', 
    {
      lambdaFunction: writeReplyData,
      // Payload defines the input that the task will get here it is output from previous tasks
      payload: stepfunctions.TaskInput.fromJsonPathAt('$.Payload'),
    }
    )
    
    // defining the state machine of step function with the steps as start and next
    const initial_step_func = new stepfunctions.StateMachine(this, 'CDK_dev_pinpointv2', 
    {
      definition: write_initial
      .next(send_message)
      .next(writeMessageId)
    })

    // Defining the trigger function for the Import/Send stepfunction
      // The enviornment will have ARN variable of the Import/Send stepfunction
    const trigger_func = new lambda.Function(this, 's3_Trigger_cdk', 
    {
      functionName: 's3_Trigger_cdk',
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset('lambda'),
      handler: 's3Notify.handler',
      environment: {
        "STEPFUNCTION_ARN": initial_step_func.stateMachineArn
      }
    })
    
    //  Adding the required policies to the role of function to access the resources it needs
    // with the ARN of the Import/Send stepfunction
    trigger_func.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:*",
          "s3:*",
          "states:*"
        ],
        resources: [
          "*",
          initial_step_func.stateMachineArn
        ],
      })
    )

    // granting the trigger function to read permission
    props.s3bucket.grantRead(trigger_func)

    // adding the object creation notification to the trigger fuction
    props.s3bucket.addEventNotification(s3.EventType.OBJECT_CREATED, 
      new s3n.LambdaDestination(trigger_func)
    )

    // granting the write_initial_func to read permission
    props.s3bucket.grantRead(write_initial_func)

    }
}