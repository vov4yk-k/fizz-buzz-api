import {Construct} from '@aws-cdk/core';
import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import {Code, Runtime, Tracing} from '@aws-cdk/aws-lambda';
import {RetentionDays} from '@aws-cdk/aws-logs';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import {REPLICATION_REGIONS, REQUESTS_TABLE_NAME} from '../src/cloudfront-handler/config';
import {EdgeFunction} from '@aws-cdk/aws-cloudfront/lib/experimental';

export class RateLimitConstruct extends Construct {

    public readonly cfRateLimitFn: EdgeFunction;

    constructor(scope: Construct, id: string, props: cdk.NestedStackProps & {region: string}) {
        super(scope, id);

        this.cfRateLimitFn = new cloudfront.experimental.EdgeFunction(
            this,
            'CfRateLimitFn',
            {
                code: Code.fromAsset('src/cloudfront-handler'),
                handler: 'index.handler',
                runtime: Runtime.NODEJS_14_X,
                logRetention: RetentionDays.ONE_DAY,
                tracing: Tracing.ACTIVE,
            }
        );

        this.createTable(props.region);
    }

    private createTable(region: string) {
        const reqTable = new dynamodb.Table(this, 'RequestsTable', {
            tableName: REQUESTS_TABLE_NAME,
            partitionKey: {name: 'PK', type: dynamodb.AttributeType.STRING},
            sortKey: {name: 'SK', type: dynamodb.AttributeType.NUMBER},
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            replicationRegions: REPLICATION_REGIONS.filter(reg => reg !== region),
            timeToLiveAttribute: 'SK'
        });
        reqTable.grantReadWriteData(this.cfRateLimitFn);
    }
}