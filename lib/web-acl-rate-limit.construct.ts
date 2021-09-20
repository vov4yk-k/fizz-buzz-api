import {Construct} from '@aws-cdk/core';
import {CfnWebACL, CfnWebACLAssociation} from '@aws-cdk/aws-wafv2';

export class WebAclRateLimitConstruct extends Construct {

    public readonly webACLRateLimit: CfnWebACL;

    constructor(scope: Construct, id: string, props: {limit: number}) {
        super(scope, id);

        this.webACLRateLimit = new CfnWebACL(this, `AclRateLimit`, {
            name: 'ApiRatelimit',
            scope: 'REGIONAL',
            defaultAction: {allow:{}},
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'RateLimitMetric',
                sampledRequestsEnabled: true
            },
            rules: [{
                name: 'RateLimit',
                priority: 0,
                action: {block: {}},
                statement: {
                    rateBasedStatement: {
                        aggregateKeyType: 'IP',
                        limit: props.limit,
                    }
                },
                visibilityConfig: {
                    metricName: 'RateLimitMetricBlock',
                    cloudWatchMetricsEnabled: true,
                    sampledRequestsEnabled: true
                }
            }],
        });
    }

    associateWithResource(resourceArn: string) {
        new CfnWebACLAssociation(this, 'ApiRateLimitAssociation', {
            webAclArn: this.webACLRateLimit.attrArn,
            resourceArn
        });
    }

}