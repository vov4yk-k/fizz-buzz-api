import * as https from 'https';
import {APIGatewayAuthorizerEvent, APIGatewayAuthorizerResult, APIGatewayAuthorizerHandler} from 'aws-lambda';
import {SecretsManagerWithCache} from '/opt/nodejs/utils';
const {REGION, SECRET_NAME} = process.env;

const secretsManager: SecretsManagerWithCache = new SecretsManagerWithCache({
    region: REGION,
    httpOptions: {
        agent: new https.Agent({keepAlive: true})
    }
});

const generatePolicy = (principalId: string, effect: string, resource: string): APIGatewayAuthorizerResult => {
    const authResponse: APIGatewayAuthorizerResult = {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: []
        }
    };
    if (effect && resource) {
        authResponse.policyDocument.Statement.push({
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource
        });
    }
    return authResponse;
};

export const handler: APIGatewayAuthorizerHandler = async (event: APIGatewayAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
    console.log('Event:', JSON.stringify(event));
    const reqSecret = event.type === 'TOKEN' ? event.authorizationToken : undefined;
    const secret = await secretsManager.getCachedSecretValue({SecretId: <string>SECRET_NAME});
    if (reqSecret !== secret) {
        throw new Error('Unauthorized');
    }
    return generatePolicy('user', 'Allow', event.methodArn);
};