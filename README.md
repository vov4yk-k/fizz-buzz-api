# Fizz Buzz API

## Deployment steps

```
# Install dependencies
npm install

# Build
npm run build

# Deploy
cdk deploy --all

```

## Deployment Verification
After the stack is deployed successfully, Outputs will contain:
 * `CheckURL` - api check url
 * `ApiSecretName` - Secrets Manager secret name. Secret should be inserted in the Authorization header of api request.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
