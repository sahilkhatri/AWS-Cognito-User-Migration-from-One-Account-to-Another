"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = require("aws-sdk");
/**
 * AWS region in which your User Pools are deployed
 */
const OLD_USER_POOL_REGION = process.env.OLD_USER_POOL_REGION || process.env.AWS_REGION;
/**
 * ID of the old User Pool from which you want to migrate users
 */
const OLD_USER_POOL_ID = process.env.OLD_USER_POOL_ID || '<OLD_USER_POOL_ID>';
/**
 * Client ID in the old User Pool from which you want to migrate users.
 */
const OLD_CLIENT_ID = process.env.OLD_CLIENT_ID || '<OLD_CLIENT_ID>';
const OLD_ROLE_ARN = process.env.OLD_ROLE_ARN;
const OLD_EXTERNAL_ID = process.env.OLD_EXTERNAL_ID;
async function authenticateUser(cognitoISP, username, password) {
    console.log(`authenticateUser: user='${username}'`);
    try {
        const params = {
            AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
            AuthParameters: {
                PASSWORD: password,
                USERNAME: username,
            },
            ClientId: OLD_CLIENT_ID,
            UserPoolId: OLD_USER_POOL_ID,
        };
        const cognitoResponse = await cognitoISP.adminInitiateAuth(params).promise();
        console.log(`authenticateUser: found ${JSON.stringify(cognitoResponse)}`);
        return lookupUser(cognitoISP, username);
    }
    catch (err) {
        console.log(`authenticateUser: error ${JSON.stringify(err)}`);
        return undefined;
    }
}
async function lookupUser(cognitoISP, username) {
    console.log(`lookupUser: user='${username}'`);
    try {
        const params = {
            UserPoolId: OLD_USER_POOL_ID,
            Username: username,
        };
        const cognitoResponse = await cognitoISP.adminGetUser(params).promise();
        console.log(`lookupUser: found ${JSON.stringify(cognitoResponse)}`);
        const userAttributes = cognitoResponse.UserAttributes ? cognitoResponse.UserAttributes.reduce((acc, entry) => (Object.assign(Object.assign({}, acc), { [entry.Name]: entry.Value })), {}) : {};
        const user = {
            userAttributes,
            userName: cognitoResponse.Username,
        };
        console.log(`lookupUser: response ${JSON.stringify(user)}`);
        return user;
    }
    catch (err) {
        console.log(`lookupUser: error ${JSON.stringify(err)}`);
        return undefined;
    }
}
async function onUserMigrationAuthentication(cognitoISP, event) {
    // authenticate the user with your existing user directory service
    const user = await authenticateUser(cognitoISP, event.userName, event.request.password);
    if (!user) {
        throw new Error('Bad credentials');
    }
    event.response.userAttributes = {
        // old_username: user.userName,
        // 'custom:tenant': user.userAttributes['custom:tenant'],
        email: user.userAttributes.email,
        email_verified: 'true',
        preferred_username: user.userAttributes.preferred_username,
    };
    event.response.finalUserStatus = 'CONFIRMED';
    event.response.messageAction = 'SUPPRESS';
    console.log(`Authentication - response: ${JSON.stringify(event.response)}`);
    return event;
}
async function onUserMigrationForgotPassword(cognitoISP, event) {
    // Lookup the user in your existing user directory service
    const user = await lookupUser(cognitoISP, event.userName);
    if (!user) {
        throw new Error('Bad credentials');
    }
    event.response.userAttributes = {
        // old_username: user.userName,
        // 'custom:tenant': user.userAttributes['custom:tenant'],
        email: user.userAttributes.email,
        email_verified: 'true',
        preferred_username: user.userAttributes.preferred_username,
    };
    event.response.messageAction = 'SUPPRESS';
    console.log(`Forgot password - response: ${JSON.stringify(event.response)}`);
    return event;
}
exports.handler = async (event, context) => {
    const options = {
        region: OLD_USER_POOL_REGION,
    };
    if (OLD_ROLE_ARN) {
        options.credentials = new aws_sdk_1.ChainableTemporaryCredentials({
            params: {
                ExternalId: OLD_EXTERNAL_ID,
                RoleArn: OLD_ROLE_ARN,
                RoleSessionName: context.awsRequestId,
            },
        });
    }
    const cognitoIdentityServiceProvider = new aws_sdk_1.CognitoIdentityServiceProvider(options);
    switch (event.triggerSource) {
        case 'UserMigration_Authentication':
            return onUserMigrationAuthentication(cognitoIdentityServiceProvider, event);
        case 'UserMigration_ForgotPassword':
            return onUserMigrationForgotPassword(cognitoIdentityServiceProvider, event);
        default:
            throw new Error(`Bad triggerSource ${event.triggerSource}`);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EscUNBQWtHO0FBR2xHOztHQUVHO0FBQ0gsTUFBTSxvQkFBb0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBRXhGOztHQUVHO0FBQ0gsTUFBTSxnQkFBZ0IsR0FBVyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLG9CQUFvQixDQUFDO0FBRXRGOztHQUVHO0FBQ0gsTUFBTSxhQUFhLEdBQVcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksaUJBQWlCLENBQUM7QUFFN0UsTUFBTSxZQUFZLEdBQXVCLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDO0FBQ2xFLE1BQU0sZUFBZSxHQUF1QixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQztBQU94RSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsVUFBMEMsRUFBRSxRQUFnQixFQUFFLFFBQWdCO0lBQzdHLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFFcEQsSUFBSTtRQUNILE1BQU0sTUFBTSxHQUE2QjtZQUN4QyxRQUFRLEVBQUUsMEJBQTBCO1lBQ3BDLGNBQWMsRUFBRTtnQkFDZixRQUFRLEVBQUUsUUFBUTtnQkFDbEIsUUFBUSxFQUFFLFFBQVE7YUFDbEI7WUFDRCxRQUFRLEVBQUUsYUFBYTtZQUN2QixVQUFVLEVBQUUsZ0JBQWdCO1NBQzVCLENBQUM7UUFDRixNQUFNLGVBQWUsR0FBRyxNQUFNLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM3RSxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMs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