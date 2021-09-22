import * as cdk from '@aws-cdk/core';
import {Code, LayerVersion, Runtime} from '@aws-cdk/aws-lambda';
import {ApiNestedStack} from './api.nested-stack';
import {CfnOutput} from '@aws-cdk/core';
import {DistributionNestedStack} from './distribution.nested-stack';

export class RootStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const utilsLayer = new LayerVersion(this, 'UtilsLayer', {
            compatibleRuntimes: [Runtime.NODEJS_12_X, Runtime.NODEJS_14_X],
            code: Code.fromAsset('src/utils'),
            description: 'utils',
        });

        const {api, auth} = new ApiNestedStack(this, `Api`, {layers: [utilsLayer]});

        const {distribution} = new DistributionNestedStack(this, 'ApiDistribution', {
            restApiId: api.restApiId, stageName: api.deploymentStage.stageName
        });

        new CfnOutput(this, 'CheckURL', {
            value: `https://${distribution.distributionDomainName}/check`
        });
        new CfnOutput(this, 'ApiSecretName', {
            value: auth.secret.secretName
        });

    }
}
