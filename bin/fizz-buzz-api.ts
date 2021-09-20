#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { FizzBuzzApiStack } from '../lib/fizz-buzz-api.stack';

const app = new cdk.App();
new FizzBuzzApiStack(app, 'FizzBuzzApiStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
