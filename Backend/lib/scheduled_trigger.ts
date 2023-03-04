import * as cdk from 'aws-cdk-lib';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import { aws_stepfunctions as stepfunctions } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Lambda } from 'aws-cdk-lib/aws-ses-actions';
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

export interface CustomProps {
    // List all the properties 
    
    stepFunction: stepfunctions.StateMachine; // the step function that is to be referred in the trigger function
    // CRON Expression to be used in the event bridge schedule
    cron: { 

        minute: string,
        hour: string,
        month:string,
        weekDay: string,
        year: string

    };
}

export class scheduled_trigger extends Construct {

    // public read access to export_step_trigger to integrate it with other aws services such as 
    public readonly export_step_trigger: lambda.Function;

    constructor(scope: Construct, id: string, props:CustomProps) {
      super(scope, id);


        //EventBridge schedule to trigger the output trigger function with the CRON Expression to define the particular time
      const timed_schedule = new events.Rule(this, "CDK_proj_schedule", {

        schedule: events.Schedule.cron(
          props.cron
            )
      })

        //Initialsing the lambda function to trigger the Step functions arn
      this.export_step_trigger = new lambda.Function(this, "export_step_trigger_CDK", 
      {
        functionName: 'export_step_trigger_CDK',
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.fromAsset('lambda'),
        handler: 'outputTrigger.handler',
        environment: {
          "STEPFUNCTION_ARN": props.stepFunction.stateMachineArn
        }
      })

      // Adding policies to the trigger function
      this.export_step_trigger.addToRolePolicy(
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

      //adding EventBridge schedule's target
      timed_schedule.addTarget(new targets.LambdaFunction(this.export_step_trigger))

    }
}


