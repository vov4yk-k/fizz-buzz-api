import * as cdk from '@aws-cdk/core';
import {
    AccessLogField,
    AccessLogFormat, IResource, IRestApi, JsonSchemaType, JsonSchemaVersion, LambdaIntegration,
    LogGroupLogDestination, MockIntegration, Model, PassthroughBehavior, RequestValidator,
    RestApi
} from '@aws-cdk/aws-apigateway';
import {Construct} from '@aws-cdk/core';
import {LogGroup, RetentionDays} from '@aws-cdk/aws-logs';
import {ILayerVersion} from '@aws-cdk/aws-lambda/lib/layers';
import {AuthConstruct} from './auth.construct';
import {Code, Function, Runtime, Tracing} from '@aws-cdk/aws-lambda';

type ApiNestedStackProps =
    cdk.NestedStackProps
    & { layers: ILayerVersion[]};

export class ApiNestedStack extends cdk.NestedStack {
    public readonly api: IRestApi;
    public readonly auth: AuthConstruct;

    constructor(scope: Construct, id: string, props: ApiNestedStackProps) {
        super(scope, id, props);

        this.auth = new AuthConstruct(this, 'auth', {layers: props.layers, region: this.region});

        const logGroup = new LogGroup(this, 'ApiGatewayAccessLogs', {retention: RetentionDays.ONE_WEEK})
        this.api = new RestApi(this, 'FizzBuzzApi', {
            restApiName: 'Fizz Buzz API',
            deployOptions: {
                accessLogDestination: new LogGroupLogDestination(logGroup),
                accessLogFormat: AccessLogFormat.custom(
                    JSON.stringify({
                        requestId: AccessLogField.contextRequestId(),
                        sourceIp: AccessLogField.contextIdentitySourceIp(),
                        path: AccessLogField.contextResourcePath(),
                        method: AccessLogField.contextHttpMethod()
                    })
                )
            }
        });

        this.addCheckResource(props);

    }

    addCheckResource(props: ApiNestedStackProps) {

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
        this.addCorsOptions(checkResource)
    }

    private addCorsOptions(apiResource: IResource) {
        apiResource.addMethod(
            "OPTIONS",
            new MockIntegration({
                integrationResponses: [
                    {
                        statusCode: "200",
                        responseParameters: {
                            "method.response.header.Access-Control-Allow-Headers":
                                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                            "method.response.header.Access-Control-Allow-Origin": "'*'",
                            "method.response.header.Access-Control-Allow-Credentials":
                                "'false'",
                            "method.response.header.Access-Control-Allow-Methods":
                                "'OPTIONS,GET,PUT,POST,DELETE'",
                        },
                    },
                ],
                passthroughBehavior: PassthroughBehavior.NEVER,
                requestTemplates: {
                    "application/json": '{"statusCode": 200}',
                },
            }),
            {
                methodResponses: [
                    {
                        statusCode: "200",
                        responseParameters: {
                            "method.response.header.Access-Control-Allow-Headers": true,
                            "method.response.header.Access-Control-Allow-Methods": true,
                            "method.response.header.Access-Control-Allow-Credentials": true,
                            "method.response.header.Access-Control-Allow-Origin": true,
                        },
                    },
                ],
            }
        );
    }

}