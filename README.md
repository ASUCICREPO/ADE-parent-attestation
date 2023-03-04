# ADE-Parent-attestation

# Overview:-
The ADE Parent attestation project is a project to overcome the problem of confirming the hours spent by students for there coursework,by taking input from Parents of student. The solution proposed is a system of 2 way SMS where a message is sent by the ADE to parents, who can reply to confirm or deny the input given by students. This works by having an automated system to send messages to the parents of all the students on a timed schedule and then waiting for a reply, further storing that reply to later analyse the response provided. 

# Description:-
The solution consists of S3 bucket used for input where the ADE can upload a JSON file with the contacts and messages.The stepfunctions send the messages and store the message ID in the dynamo db table. When the parent reply it is stored corresponding to the table. On a particular schedule, event bridge triggers stepfunctions to export the data in dynamo DB table to output S3 bucket in a date format,  that can be later on used. The Dynamo DB table is deleted in the process after copying the data in S3 and a new Dynamo DB table is created in its place that can be used when the stepfunction to send message runs again. The major challenge faced during the course of the project was the time taken by the complete formailities before you can get a phone number.

# High Level Architecture:-
The architectural diagram is in the file named as the `ADE Parent attestation project.pdf`, it is referenced in the code 


# Prerequisites

-> Let's initialise the AWS Pinpoint Project in the aws management console and then in the folder `lib` change the variables `applicationId = "THE AWS-PINPOINT APPLICATION ID"` with your pinpoint application ID that can be found in the settings of pinpoint project and the variable `OriginationNum = "+1XXXXXXXX"` with the phone number that you will receive after following the steps given below.

-> For the project to run the 2 way SMS we need an origination phone number that can be used to send the message and receive the reply. It can be either a long code or a 10DLC phone number as it can be read here: `https://docs.aws.amazon.com/pinpoint/latest/userguide/channels-sms-awssupport.html`. After the project is initialised in the aws console you need to go to console and complete the steps to request it :-

1) The long code number as given here: `https://docs.aws.amazon.com/pinpoint/latest/userguide/channels-sms-awssupport-long-code.html`
   
----***********************************************************`OR`************************************************************------
   
1) The 10DLC phone number can be requested by folowing these steps : `https://docs.aws.amazon.com/pinpoint/latest/userguide/settings-sms-10dlc.html`
   
2) After registering the company go to the phone numbers section in aws pinpoint console and click on the 10DLC campaigns to create a 10DLC campaign by clicking on the button on the top right corner.
   
3) Here select the company that you have registered and fill in the information as needed. 
   
4) This will create the 10DLC campaign that can be assigned to a number when we request phone number.
   
5) Now, go back to the phone number section in the aws pinpoint project to click on request a phone number.
   
6) This, will prompt you to select country, here search the country that you want.
   
7) In the Number type select the 10DLC with options of SMS and selct the 10DL capmpaign that we just created and select the message type as Promotional as it is for most cases but you can check according to your use case and you will need to update it in the send message function if it is not promotional.
   
8) Click on next, and this will give you your origination number.
   
9)  Now, you need to go to AWS Pinpoint console in the Project that you created and in settings enable the SMS channel and then increase the SMS Quota from $1 to any particular amount you would like.
   
10) Now in the file `PinpointV3Stack.ts` in the folder `lib` change the variable `OriginationNum = "+1XXXXXXXX"` to add the origination number to enable its messaging ablity.
    

# Deployment Guide:-

1) Make sure you have installed AWS CDK, you can update it globally by command `npm install -g aws-cdk`.
   
2) Run the command in the terminal `aws configure` to configure the aws cli with your aws profile.
    
3) Run the command in the terminal `cd Backend` to open the directory of project.
   
4) Run the command `npm i` to install all of the dependencies needed in the project as they are given in the `package.json` file.
   
5) Open the file `custom_cnstr.ts` in the folder `bin` and update the values `envDev = {account: 'YOUR AWS ACCOUNT', region: 'AWS-REGION' }` with your AWS Account and the AWS Region of choice.
   
6) Run the command `cdk synth` to synthesize an AWS CloudFormation template for deployment
   
7) Run the command `cdk bootstrap` to bootstrap the project enviornment before deploying it.
   
8) Run the command `cdk deploy` to deploy the project or `cdk deploy --outputs-file ./output.json` to deploy the project and save the output values of input bucket and output bucket in the file `output.json`.
   
9)  You can go now see the input bucket name and output bucket name that you can use.
    
10) To enable 2 way SMS for your project you need to open the AWS Pinpoint Project that you created and open the phone numbers to click on the phone number that you used to replace the `OriginationNum = "+1XXXXXXXX"`. Click on the `Two-way SMS` to select the option to enable two way sms. Now select the `Incoming message destination` with `Choose an existing SNS topic` to choose the SNS topic created after the deployment, the SNS topic name `twoWaySMStopic` and click on save.

# User Guide:-
The project is intended to be used by someone who has access to AWS, and can interact wiht the AWS console. The users can use this solution by uploading the JSON file with the target phone nuber and text message in the given format in the folder `Docs/sampleData`, the file `sampleUpload.json`. It has all the parameters that can be used including a UserID parameter, file consists of an example of the format.

 You can edit the file `Docs/sampleData/sampleUpload.json` according to the message you want to send or receive afterwards upload the file to S3 input bucket,(name of input bucket can be found and configured in the file `PinpointV3Stacks`) and you will receive the text message as per your file. You can reply to that and the lastest reply will be saved to the Dynamo DB table, which can be looked instantly to verify the reply is stored with corresponding to message sent to the particular phone number. You can wait for the default time(Mon-Fri, 10pm (MST), it can be changed in the file `PinpointV3Stacks` under the `scheduled_trigger_func` function where CRON time can be set) the report will be generated in a JSON format in the S3 output bucket(name an be found and configured in the the file `PinpointV3Stacks`),  in the format of a json array as sample given in file `Docs/sampleData/resultS3outputSample.json`. 

# Credits:-

Developer: 
    [Loveneet Singh](https://www.linkedin.com/in/loveneet-singh-6bb2851ba/)

Sr. Program Manager, AWS: 
    [Jubleen Vilku](https://www.linkedin.com/in/jubleen-vilku/)

Architect:
    [Arun Arunachalam](https://www.linkedin.com/in/arunarunachalam/)

General Manager, ASU: 
    [Ryan Hendrix](https://www.linkedin.com/in/ryanahendrix/)

This project is designed and developed with guidance and support from the [ASU Cloud Innovation Center](https://smartchallenges.asu.edu) and the City of Phoenix, Arizona teams.
