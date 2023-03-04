import * as cdk from 'aws-cdk-lib';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as SNS from "aws-cdk-lib/aws-sns";
import * as snsSub from "aws-cdk-lib/aws-sns-subscriptions"

export interface CustomProps {

    dynamoTableName: string; //dynamodb table name 

}

export class topic_response extends Construct {

    public readonly SNS_2way: SNS.Topic; // The SNS topic read access for integration


    constructor(scope: Construct, id: string, props:CustomProps) {
      super(scope, id);

        //  Function to be triggered when we get a reply from a message sent using the AWS Pinpoint
        //  We define its properties and reference to the folder with enviornment consisting of table name
        const reply_func = new lambda.Function(this, 'reply_func_cdk', 
        {
        functionName: 'reply_func_cdk',
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.fromAsset('lambda'),
        handler: 'reply.handler',
        environment: {
            "TABLE_NAME": props.dynamoTableName
            }
        })

        //  Adding the required policies to the role of function to access the resources it needs
        reply_func.addToRolePolicy(
        new iam.PolicyStatement(
            {
                effect: iam.Effect.ALLOW,
                actions: [
                "logs:*",
                "dynamodb:*",
                "states:*",
                "mobiletargeting:*",
                "sns:*"
                ],
                resources: ["*"],
                }
            )
        )

        //Defining the SNS that has been connected to the AWS Project so that we can use it to add subscription to the Lambda function of reply
        this.SNS_2way = new SNS.Topic(this, "twoWaySMStopic")


        // Adding the subscription
        this.SNS_2way.addSubscription(new snsSub.LambdaSubscription(reply_func))

    }
}
