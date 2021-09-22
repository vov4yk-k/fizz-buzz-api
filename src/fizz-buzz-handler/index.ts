import {APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler} from 'aws-lambda';
import {BadRequestResponse, OkResponse} from '/opt/nodejs/utils';

type ResultMessage = { result: string };
const msgConditions: [string, number][] = [
    ['fizz', 3],
    ['buzz', 5]
];

const createResultMessage = (value: number): ResultMessage => {
    const msgs: String[] = [];
    for (const [msg, condNumber] of msgConditions) {
        if (value % condNumber === 0) {
            msgs.push(msg);
        }
    }
    if (!msgs.length) {
        throw new Error(`Unsupportable number value - ${value}`);
    }
    return {result: msgs.join('')};
};

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Event:', JSON.stringify(event));
    if (typeof event.body !== 'string') {
        return new BadRequestResponse('Request body cant be empty!');
    }
    const {number} = JSON.parse(event.body);
    try {
        const result: ResultMessage = createResultMessage(number);
        return new OkResponse(result);
    } catch (e) {
        return new BadRequestResponse(e.message);
    }
};