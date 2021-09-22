import * as cdk from '@aws-cdk/core';
import {Construct} from '@aws-cdk/core';
import {
    AccessLogField, AccessLogFormat, Cors, IRestApi, JsonSchemaType, JsonSchemaVersion,
    LambdaIntegration, LogGroupLogDestination, Model,
    RequestValidator, RestApi
} from '@aws-cdk/aws-apigateway';
import {LogGroup, RetentionDays} from '@aws-cdk/aws-logs';
import {ILayerVersion} from '@aws-cdk/aws-lambda/lib/layers';
import {AuthConstruct} from './auth.construct';
import {Code, Function, Runtime, Tracing} from '@aws-cdk/aws-lambda';

type ApiNestedStackProps =
    cdk.NestedStackProps
    & { layers: ILayerVersion[] };

export class ApiNestedStack extends cdk.NestedStack {

    public readonly api: IRestApi;
    public readonly auth: AuthConstruct;

    constructor(scope: Construct, id: string, props: ApiNestedStackProps) {
        super(scope, id, props);

        this.auth = new AuthConstruct(this, 'Auth', {layers: props.layers, region: this.region});

        this.api = new RestApi(this, 'FizzBuzzApi', {
            restApiName: 'Fizz Buzz API',
            deployOptions: {
                accessLogDestination: this.createApiLogDestination(),
                accessLogFormat: AccessLogFormat.custom(
                    JSON.stringify({
                        requestId: AccessLogField.contextRequestId(),
                        sourceIp: AccessLogField.contextIdentitySourceIp(),
                        path: AccessLogField.contextResourcePath(),
                        method: AccessLogField.contextHttpMethod()
                    })
                )
            },
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
            },
        });

        this.addCheckResource(props);

    }

    private addCheckResource(props: ApiNestedStackProps) {

        const requestHandler: Function = new Function(this,
            `FizzBuzzHandler`,
            {
                runtime: Runtime.NODEJS_14_X,
                code: Code.fromAsset('src/fizz-buzz-handler'),
                handler: 'index.handler',
                functionName: `FizzBuzzHandler`,
                tracing: Tracing.ACTIVE,
                logRetention: RetentionDays.ONE_WEEK,
                layers: props.layers
            });

        const requestRestApiLambdaIntegration = new LambdaIntegration(requestHandler);

        const requestModel: Model = new Model(this, `CheckRequestModel`, {
            modelName: 'CheckRequestModel',
            contentType: 'application/json',
            restApi: this.api,
            schema: {
                schema: JsonSchemaVersion.DRAFT4,
                title: 'CheckRequestModel',
                type: JsonSchemaType.OBJECT,
                additionalProperties: false,
                properties: {
                    'number': {'type': JsonSchemaType.NUMBER}
                },
                required: ['number']
            }
        });

        const checkResource = this.api.root.addResource('check');
        checkResource.addMethod('POST', requestRestApiLambdaIntegration, {
            requestModels: {'application/json': requestModel},
            requestValidator: new RequestValidator(this, `ApiValidator`, {
                restApi: this.api,
                validateRequestBody: true
            }),
            authorizer: this.auth.authorizer
        });

    }

    private createApiLogDestination() {
        const logGroup = new LogGroup(this, 'ApiGatewayAccessLogs', {retention: RetentionDays.ONE_WEEK});
        return new LogGroupLogDestination(logGroup);
    }
}