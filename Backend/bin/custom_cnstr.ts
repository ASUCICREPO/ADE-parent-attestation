#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PinpointV3Stack } from '../lib/PinpointV3Stack';

const envDev = {account: 'YOUR AWS ACCOUNT', region: 'AWS-REGION' }

const app = new cdk.App();
new PinpointV3Stack(app, 'PinpointV3Stack', {
  env: envDev,
  description: "The stack is a two way SMS solution using pinpoint to send messages and save replies in a dynamo db table. Data is exported at a schedule to s3."
});