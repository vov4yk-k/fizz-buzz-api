import {Construct} from '@aws-cdk/core';
import {ILayerVersion} from '@aws-cdk/aws-lambda/lib/layers';
import {TokenAuthorizer} from '@aws-cdk/aws-apigateway';
import {Code, Function, Runtime, Tracing} from '@aws-cdk/aws-lambda';
import {RetentionDays} from '@aws-cdk/aws-logs';
import {Secret} from '@aws-cdk/aws-secretsmanager';

type AuthorizerProps = { layers?: ILayerVersion[] , region: string};

export class AuthConstruct extends Construct {

    public readonly authorizer: TokenAuthorizer;
    public readonly secret: Secret;

    constructor(scope: Construct, id: string, props: AuthorizerProps) {
        super(scope, id);

        const authorizerFn = new Function(scope, 'AuthorizerFunction', {
            runtime: Runtime.NODEJS_14_X,
            code: Code.fromAsset('src/authorizer'),
            handler: 'index.handler',
            tracing: Tracing.ACTIVE,
            logRetention: RetentionDays.ONE_WEEK,
            environment: {
                'REGION': props.region
            },
            layers: props.layers
        });

        if (authorizerFn.role) {
            this.secret = this.createSecret();
            this.secret.grantRead(authorizerFn.role);
            authorizerFn.addEnvironment('SECRET_NAME', this.secret.secretName);
        }


        this.authorizer = new TokenAuthorizer(this, `ApiAuthorizer`, {
            authorizerName: `ApiAuthorizer`,
            handler: authorizerFn,
            identitySource: 'method.request.header.Authorization'
        });

    }

    private createSecret(): Secret {
        return new Secret(this, 'ApiSecret', {
            secretName: 'ApiSecret',
            generateSecretString: {
                passwordLength: 64,
                excludePunctuation: true
            }
        });
    }
}