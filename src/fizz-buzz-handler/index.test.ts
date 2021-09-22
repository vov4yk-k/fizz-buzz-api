import {APIGatewayProxyEvent, Context} from 'aws-lambda';
import {BadRequestResponse, OkResponse} from '/opt/nodejs/utils';

const {handler} = require('./index');

const context = {} as Context;

const Event = (body: any): APIGatewayProxyEvent => <APIGatewayProxyEvent>({body: body && JSON.stringify(body)});

test('bad request', async () => {
    await expect(handler(Event(null), context, null)).resolves.toStrictEqual(new BadRequestResponse('Request body cant be empty!'));
    await expect(handler(Event({number: 1}), context, null)).resolves.toStrictEqual(new BadRequestResponse('Unsupportable number value - 1'));
});

test('correct message is generated', async () => {
    await expect(handler(Event({number: 10}), context, null)).resolves.toStrictEqual(new OkResponse({result: 'buzz'}));
    await expect(handler(Event({number: 12}), context, null)).resolves.toStrictEqual(new OkResponse({result: 'fizz'}));
    await expect(handler(Event({number: 15}), context, null)).resolves.toStrictEqual(new OkResponse({result: 'fizzbuzz'}));
});