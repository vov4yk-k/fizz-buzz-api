import {APIGatewayProxyResult} from 'aws-lambda';
import * as AWS from 'aws-sdk';

export class BadRequestResponse implements APIGatewayProxyResult {
    body: string;
    statusCode: number;

    constructor(message: string) {
        this.statusCode = 400;
        this.body = JSON.stringify({error: message});
        console.log('Bad Request', JSON.stringify(this));
    }
}

export class OkResponse implements APIGatewayProxyResult {
    body: string;
    statusCode: number;
    headers?: {
        [header: string]: boolean | number | string;
    } | undefined;

    constructor(response: object) {
        this.statusCode = 200;
        this.headers = {'Content-Type': 'application/json'};
        this.body = JSON.stringify(response);
        console.log('Response', JSON.stringify(this));
    }
}

export class SecretsManagerWithCache {

    private client: AWS.SecretsManager;
    private secretsCache: Map<string, string | undefined>;

    constructor(options?: AWS.SecretsManager.Types.ClientConfiguration) {
        this.client = new AWS.SecretsManager(options);
        this.secretsCache = new Map();
    }

    public async getCachedSecretValue(params: AWS.SecretsManager.Types.GetSecretValueRequest): Promise<string | undefined> {
        if (this.secretsCache.has(params.SecretId)) {
            return Promise.resolve(this.secretsCache.get(params.SecretId));
        }
        const secret = await this.getSecret(params);
        this.secretsCache.set(params.SecretId, secret);
        return secret;
    }

    private async getSecret(params: AWS.SecretsManager.Types.GetSecretValueRequest): Promise<string | undefined> {
        const data = await this.client.getSecretValue(params).promise();
        if ('SecretString' in data) {
            return data.SecretString;
        }
        const buff = new Buffer(<string>data.SecretBinary, 'base64');
        return buff.toString('ascii');
    }

}