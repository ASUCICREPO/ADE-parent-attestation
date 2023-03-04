import * as cdk from 'aws-cdk-lib';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import { aws_stepfunctions as stepfunctions } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Lambda } from 'aws-cdk-lib/aws-ses-actions';

export interface CustomProps {
    enviornmt : string
    dynamoTableName: string; // dynamo db table name
    s3Bucket: s3.Bucket; // output s3 bucket to be referenced
}

export class exportLambdaStepFunc extends Construct {

    // public read access to step function to export data to enable integration with a trigger function or other aws services
    public readonly Export_data_step_func: stepfunctions.StateMachine;

    constructor(scope: Construct, id: string, props:CustomProps) {
      super(scope, id);
  
      
      //  Defining the Lambda functions in the Step function to Export data 
  
      //  This function is to create dynamo db table
      //  We define its properties and reference to the folder with enviornment as the name of table that we created
      const create_table_func =   new lambda.Function(this, 'create_table_func_cdk', 
      {
        functionName: 'create_table_func_cdk',
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.fromAsset('lambda'),
        handler: 'createTable.handler',
        environment: {
          "TABLE_NAME":    props.dynamoTableName
        }
      })
  
      //  Adding the required policies to the role of SNS to access the resources it needs
      create_table_func.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "logs:*",
            "dynamodb:*",
            "states:*"
          ],
          resources: ["*"],
        })
      )
  
      // this function is to delete table
      //  We define its properties and reference to the folder with enviornment as the name of table that we created
      const delete_table_func = new lambda.Function(this , "delete_table_cdk", {
        functionName: 'delete_table_cdk',
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.fromAsset('lambda'),
        handler: 'deleteTable.handler',
        environment: {
          "TABLE_NAME": props.dynamoTableName
        }
      })
  
      //  Adding the required policies to the role of SNS to access the resources it needs
      delete_table_func.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "logs:*",
            "dynamodb:*",
            "states:*"
          ],
          resources: ["*"],
        })
      )
  
      // function to read data from dynamo db and write to S3
      //  We define its properties and reference to the folder with enviornment as the name of S3 bucket that we created
       const read_data = new lambda.Function(this, "read_data_cdk", {
        functionName: 'read_data_cdk',
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.fromAsset('lambda'),
        handler: 'readData.handler',
        environment: {
          "TABLE_NAME": props.dynamoTableName,
          "BUCKET_NAME": props.s3Bucket.bucketName
        }
      })
  
      //  Adding the required policies to the role of SNS to access the resources it needs
      read_data.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "logs:*",
            "dynamodb:*",
            "states:*",
            "s3:*",
          ],
          resources: ["*"],
        })
      )

      // granting read and write permission to read_data lambda function
      props.s3Bucket.grantReadWrite(read_data)
  
      //workflow task1 to read data from dynamodb to write to s3
      const read_step = new tasks.LambdaInvoke(this, 'read_data_1', 
      {
        lambdaFunction: read_data,
         // Payload defines the input that the task will get here it is taking all the input from the Output Trigger function
        payload: stepfunctions.TaskInput.fromJsonPathAt('$'),
      }
      )
  
      //workflow task 2 to delete the table
      const delete_step = new tasks.LambdaInvoke(this, 'delete_table_2', 
      {
        lambdaFunction: delete_table_func,
        // Payload defines the input that the task will get here it is output from previous tasks
        payload: stepfunctions.TaskInput.fromJsonPathAt('$.Payload'),
      }
      )
      //workflow task 3 to WAIT 20s to write message id to dynamodb
      const wait_step = new stepfunctions.Wait(this, 'Wait_3', {
        time: stepfunctions.WaitTime.duration(Duration.seconds(20))
      });
  
      //workflow task4 to create the table we just deleted
      const create_step = new tasks.LambdaInvoke(this, 'create_table_4', 
      {
        lambdaFunction: create_table_func,
        // Payload defines the input that the task will get here it is output from previous task
        payload: stepfunctions.TaskInput.fromJsonPathAt('$.Payload'),
      })
      
      //defining the state machine of step function with the start and next steps
      this.Export_data_step_func = new stepfunctions.StateMachine(this, 'Export_data_CDK_', 
      {
        definition: read_step
        .next(delete_step)
        .next(wait_step)
        .next(create_step)
      })
  
  
    
    
    }
}