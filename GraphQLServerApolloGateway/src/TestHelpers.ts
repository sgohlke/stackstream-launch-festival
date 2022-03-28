import {
    GraphQLRequestInfo,
    GraphQLServerOptions,
    JsonLogger
} from '@dreamit/graphql-server'
import {
    userSchema,
    userSchemaResolvers
} from './ExampleSchemas'
import fetch from 'cross-fetch'

export const APOLLO_GRAPHQL_SERVER_PORT = 3000
export const DREAMIT_GRAPHQL_SERVER_PORT = 3001
export const USER_SERVICE_GRAPHQL_SERVER_PORT = 4001
export const FRUITS_SERVICE_GRAPHQL_SERVER_PORT = 4002
export const GATEWAY_LOGGER = new JsonLogger('gateway-logger', 'gateway')
export const USER_LOGGER = new JsonLogger('user-logger', 'user-service')
export const FRUITS_LOGGER = new JsonLogger('fruits-logger', 'fruits-service')


export function generateGetParametersFromGraphQLRequestInfo(requestInfo: GraphQLRequestInfo)
: string {
    let result = ''
    if (requestInfo.query) {
        result += `query=${requestInfo.query}&`
    }
    if (requestInfo.operationName) {
        result += `operationName=${requestInfo.operationName}&`
    }
    if (requestInfo.variables) {
        result += `variables=${JSON.stringify(requestInfo.variables)}`
    }
    return encodeURI(result)
}

export function fetchResponse(
    port: number,
    body: BodyInit,
    method = 'POST',
    // eslint-disable-next-line unicorn/no-object-as-default-parameter
    headers: HeadersInit = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json'
    }
): Promise<Response> {
    return fetch(`http://localhost:${port}/graphql`,
        {method: method, body: body, headers: headers})
}
