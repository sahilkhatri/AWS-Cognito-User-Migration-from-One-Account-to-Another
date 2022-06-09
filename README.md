# AWS-Cognito-User-Migration-from-One-Account-to-Another

AWS Cognito User migration from one account to the other without needing users to re-verify

Scenario: 
We have an existing user pool in Account1 that authorizes the users for accessing a web application. Due to some circumstances, we are required to migrate our workload to another account i.e. Account2. Due to this, we are required to set up a workflow that migrates the user pool from the old account (Account1) to the new one (Account2). We also need to do it in such a way that it does not require the users to again verify themselves. 

To set up this workflow, we will follow the below steps:
Let’s assume that we already have the user pool set up in the old and new accounts. Make sure that the ALLOW_ADMIN_USER_PASSWORD_AUTH is enabled in the old user pool. In the new user pool (new account) the client must use USER_PASSWORD_AUTH.


1.	In Account1 create the role “cognito-access-role” and Allow the actions cognito-idp:AdminGetUser and cognito-idp:AdminInitiateAuth (Or you can simply give AmazonCognitoPowerUser permission). In the “Trust relationships” of this role allow the “cognito-migration-lambda” role of the Account2 (we will create this role in the further steps) to assume this role. 

<img alt="png" src="https://github.com/sahilkhatri/AWS-Cognito-User-Migration-from-One-Account-to-Another/blob/main/trust_relationship_for_old_account_role.png">

This Trust relationship will let the lambda function (which is in another account) Assume this role and perform the necessary steps.

2.	Create the lambda function test-migration-cognito in Account2. The nodejs code for this function can be found in this repo.

Configure the following Environment Variables for the lambda function:
- OLD_CLIENT_ID 	(AppClient id)
- OLD_EXTERNAL_ID 	(External id mentioned in the cognito-access-role in account 1)
- OLD_ROLE_ARN	(Arn of the cognito-access-role role)
- OLD_USER_POOL_ID 	(Pool id of the userpool)
- OLD_USER_POOL_REGION	(Region of the userpool)

3.	In Account2 create a policy “cognito-migration-lambda-policy” which allows the cognito-idp:AdminInitiateAuth, cognito-idp:AdminGetUser, and sts:AssumeRole actions on the Userpool and cognito-access-role that we created previously in the Account1. 

<img alt="png" src="https://github.com/sahilkhatri/AWS-Cognito-User-Migration-from-One-Account-to-Another/blob/main/policy_for_lambda_function_in_new_account.png">

4.	Attach the policy created in step 3 with the role of the lambda function. This policy will allow the lambda function to assume the “cognito-access-role” role present in Account1 and also permits it to get user data from the User pool in Account1.

To test the migration of users from the old account user pool to the new account user pool, create a user in the old account. After that Launch Hosted UI from the new account App client settings. Enter the username and password. This will redirect you to the Callback URL mentioned in the App Client. Under Users and groups, you can see that the user is added to the new user pool upon signing in using the given credentials.
