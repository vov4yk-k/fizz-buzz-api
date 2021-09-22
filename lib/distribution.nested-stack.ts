import * as cdk from '@aws-cdk/core';
import {Construct} from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import {CloudFrontWebDistribution, LambdaEdgeEventType} from '@aws-cdk/aws-cloudfront';
import {RateLimitConstruct} from './rate-llimit.construct';

type DistributionNestedStackProps =
    cdk.NestedStackProps
    & { restApiId: string, stageName: string };

export class DistributionNestedStack extends cdk.NestedStack {

    public readonly distribution: CloudFrontWebDistribution;

    constructor(scope: Construct, id: string, props: DistributionNestedStackProps) {
        super(scope, id, props);

        const {cfRateLimitFn} = new RateLimitConstruct(this, 'RateLimit', {region: this.region});

        this.distribution = new cloudfront.CloudFrontWebDistribution(this, 'FizzBuzzDistribution', {
            originConfigs: [
                {
                    customOriginSource: {
                        domainName: `${props.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
                    },
                    originPath: `/${props.stageName}`,
                    behaviors: [
                        {
                            isDefaultBehavior: true,
                            lambdaFunctionAssociations: [
                                {
                                    lambdaFunction: cfRateLimitFn.currentVersion,
                                    eventType: LambdaEdgeEventType.VIEWER_REQUEST
                                },
                            ],
                            allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
                        },
                    ],
                },
            ],
        });

    }

}