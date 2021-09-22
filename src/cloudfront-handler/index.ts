import {CloudFrontRequestEvent, CloudFrontRequestResult} from 'aws-lambda';
import {CloudFrontRequest} from 'aws-lambda/common/cloudfront';
import {DynamoDB} from 'aws-sdk';
import * as https from 'https';
import {REPLICATION_REGIONS, REQUESTS_TABLE_NAME, REQUEST_RATE} from './config';

const {AWS_REGION} = process.env;

const dbClient = new DynamoDB.DocumentClient({
    region: REPLICATION_REGIONS.find(itm => itm === AWS_REGION) || REPLICATION_REGIONS[0],
    httpOptions: {agent: new https.Agent({keepAlive: true})}
});

const getIpRatePeriodEndDate = async (ip: string): Promise<number> => {

    const now = Date.now();
    const end = now + 1000 * 60;

    const params = {
        TableName: REQUESTS_TABLE_NAME,
        KeyConditionExpression: 'PK = :ip and SK > :now',
        ExpressionAttributeValues: {
            ':ip': ip,
            ':now': now,
        },
        ProjectionExpression: 'SK',
        Limit: 1,
        ScanIndexForward: false
    };

    try {
        const {Items} = await dbClient.query(params).promise();
        return Items?.pop()?.SK || end;
    } catch (e) {
        console.error(e);
    }

    return end;

};

const checkRequestsFromIp = async (ip: string) => {

    const endDate = await getIpRatePeriodEndDate(ip);

    return dbClient.update({
        TableName: REQUESTS_TABLE_NAME,
        Key: {
            PK: ip,
            SK: endDate
        },
        UpdateExpression: 'ADD requests :num',
        ConditionExpression: 'attribute_not_exists(requests) OR requests < :limit',
        ExpressionAttributeValues: {
            ':num': 1,
            ':limit': Number(REQUEST_RATE)
        },
        ReturnValues: 'NONE'
    }).promise();

};

export const handler = async (event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> => {
    console.log('EVENT:', JSON.stringify(event));
    const request: CloudFrontRequest = event.Records[0].cf.request;
    try {
        await checkRequestsFromIp(request.clientIp);
        return {statusCode: 200, ...request} as CloudFrontRequestResult;
    } catch (e) {
        console.error(e);
        return {
            status: '429',
            statusDescription: 'Too Many Requests'
        } as CloudFrontRequestResult;
    }
};

