import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as FizzBuzzApi from '../lib/root.stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new FizzBuzzApi.RootStack(app, 'MyTestStack', {env: {region: 'eu-west-1'}});
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
