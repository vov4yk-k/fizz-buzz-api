import * as cdk from '@aws-cdk/core';
import {Code, LayerVersion, Runtime} from '@aws-cdk/aws-lambda';
import {ApiNestedStack} from './api.nested-stack';
import {WebAclRateLimitConstruct} from './web-acl-rate-limit.construct';
import {CfnOutput} from '@aws-cdk/core';

export class FizzBuzzApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const utilsLayer = new LayerVersion(this, 'utils-layer', {
      compatibleRuntimes: [Runtime.NODEJS_12_X, Runtime.NODEJS_14_X],
      code: Code.fromAsset('src/utils'),
      description: 'utils',
    });

    const rateLimit = new WebAclRateLimitConstruct(this, 'RateLimitConstruct',{limit: 100});

    const {api, auth} = new ApiNestedStack(this, `Api`, {layers: [utilsLayer]});

    rateLimit.associateWithResource(`arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${api.deploymentStage.stageName}`);

    new CfnOutput(this, 'CheckURL', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/prod/check`,
    });

    new CfnOutput(this, 'ApiSecretName', {
      value: auth.secret.secretName
    });
  }
}
