import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { exportLambdaStepFunc } from "./exportLambdaStepFunc"; // importing construct for exporting data to s3 from dynamo db table
import { importstepLambda } from "./importstepLambda"; // importing construct for Importing data to read and send message
import { topic_response } from "./topic_response"; // importing construct to store response in dynamo db table
import { scheduled_trigger } from "./scheduled_trigger"; // importing construct to create a schedule with a trigger
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import console = require("console");

export class PinpointV3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //********************---ENVIORNMENT-VARIABLES---******************* */

    //This application Id needs to be updated with the real application id from the Pinpoint project after
    //it is initialised after running cdk deploy once
    const application_Id = "THE AWS-PINPOINT APPLICATION ID";

    // The Originaton number needs to be updated after you receive the phone number after completing steps in read.me
    const OriginationNum = "+1XXXXXXXXX";
    //********************---ENVIORNMENT-VARIABLES---END---******************* */

    const nameTable = "Sms_data_cdk"; // name assigned to the dynamo db table
    const input_bucket = "inputbucketawscdk"; // name assigned to the input s3 bucket
    const output_bucket = "outputbucketawscdk"; // name assigned to the output s3 bucket

    // Random string generation for the nucket name
    let randomString = (Math.random() + 1).toString(36).substring(7);
    let randomString2 = (Math.random() + 2).toString(36).substring(7);

    // The bucket bucket name generated using the random string
    const inputBucketgenerated = input_bucket + randomString;
    const outputBucketgenerated = output_bucket + randomString2;

    // S3 input bucket initialisation
    const s3_input_bucket = new s3.Bucket(this, inputBucketgenerated, {
      versioned: false,
      bucketName: inputBucketgenerated,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // output value for input bucket
    const InputName = new cdk.CfnOutput(this, "S3inputBucketName", {
      value: s3_input_bucket.bucketName,
      description: 'The name of the s3 bucket',
      exportName: 'InputBucket',
    })

    // Dynamo db table initialised with the nameTable variable
    const dynamo_table = new dynamodb.CfnTable(this, nameTable, {
      tableName: nameTable,
      keySchema: [
        {
          attributeName: "id",
          keyType: "HASH",
        },
      ],
      attributeDefinitions: [
        {
          attributeName: "id",
          attributeType: "S",
        },
      ],
      provisionedThroughput: {
        readCapacityUnits: 10,
        writeCapacityUnits: 10,
      },
    });

    // This construct creates a stepfunction to import data from s3 and send message while writing that in the table as it is referred in the (1) section in the architectural diagram
    // This construct takes the parameters (dynamoTableName: name of the dynamodb table to create a table,s3bucket: s3 input bucket to be referred,
    // applicationId: pinpoint application id, OriginationNum: phone number)
    const import_message_stepFunc = new importstepLambda(
      this,
      "message_step_func_CDK",
      {
        dynamoTableName: nameTable,
        s3bucket: s3_input_bucket,
        applicationId: application_Id,
        OriginationNum: OriginationNum,
      }
    );

    // This constuct is for handling two way response by creating a SNS topic connected to a lambda function as referred in the (2) section in the architecture diagram
    // The SNS topic created here needs to be connected to the AWS Pinpoint project under phone number and the two way sms setting
    // This constuct can take parameter:- dynamoTableName: the name of dynamo db table for storing the reply in a dynamo db table
    const response_topic_lambda = new topic_response(this, "response_lambda", {
      dynamoTableName: nameTable,
    });

    // Initialising the Output S3 bucket that needs to be connected to the Read_data function
    const s3_output_bucket = new s3.Bucket(this, outputBucketgenerated, {
      versioned: false,
      bucketName: outputBucketgenerated,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // output bucket 
    const outputBucket = new cdk.CfnOutput(this, "S3outputBucketName", {
      value: s3_output_bucket.bucketName,
      description: 'The name of the s3 bucket',
      exportName: 'OutputBucket',
    })
    

    // This construct is for exporting data from a dynamo db table to s3 output bucket as it is referred in the (4) section of architectural diagram
    // This construct has parameters:- dynamoTableName: name of dyname db table, s3Bucket: s3 output bucket to be referenced
    // This construct gives read access to:- Export_data_step_func: the step function for exporting data from a dynamo db table to s3 output bucket
    const export_stepFunc = new exportLambdaStepFunc(
      this,
      "Export_step_function_cdk",
      {
        dynamoTableName: nameTable,
        s3Bucket: s3_output_bucket,
        enviornmt: "dewfcwre4fe"
      }
    );

    // This construct is creating a schedule in the event bridge attached to a lambda function, as it is referred in the (3) section of architectural diagram
    // This construct has parameters:- stepFunction: the target stepfunction that needs to be triggered, cron: { cron expression for a schedule}
    // This construct has lambda function :- read_data for access outside the construct to link to s3 that it needs permission
    const scheduled_trigger_func = new scheduled_trigger(
      this,
      "scheduled_trigger",
      {
        stepFunction: export_stepFunc.Export_data_step_func,
        cron: {
          minute: "0",
          hour: "22",
          month: "*",
          weekDay: "MON-FRI",
          year: "*",
        },
      }
    );
  }
}
