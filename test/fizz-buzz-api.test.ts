import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as FizzBuzzApi from '../lib/fizz-buzz-api.stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new FizzBuzzApi.FizzBuzzApiStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
