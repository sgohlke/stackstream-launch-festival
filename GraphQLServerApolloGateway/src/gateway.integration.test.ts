import express, {Express} from 'express'

import {
    usersQuery,
    userSchema,
    userSchemaResolvers,
    userOne,
    userTwo,
    userThree,
    fruitsSchema,
    fruitsSchemaResolvers,
    fruitsQuery,
    fruitsArray
} from './ExampleSchemas'
import {
    fetchResponse,
    FRUITS_LOGGER,
    FRUITS_SERVICE_GRAPHQL_SERVER_PORT,
    APOLLO_GRAPHQL_SERVER_PORT,
    USER_LOGGER,
    USER_SERVICE_GRAPHQL_SERVER_PORT,
    GATEWAY_LOGGER,
    DREAMIT_GRAPHQL_SERVER_PORT
} from './TestHelpers'
import {
    GraphQLServer,
    GraphQLServerRequest,
    GraphQLServerResponse,
    Logger
} from '@dreamit/graphql-server'
import {Server} from 'node:http'
import {
    ApolloGateway,
    IntrospectAndCompose
} from '@apollo/gateway'
import {
    ApolloServer
} from 'apollo-server'
import {
    ExecutionArgs,
    ExecutionResult,
    GraphQLError,
    GraphQLSchema,
    Kind
} from 'graphql'
import {ApolloGatewayGraphQlServer} from './ApolloGatewayGraphQlServer'
import {PromiseOrValue} from 'graphql/jsutils/PromiseOrValue'
import {
    CacheHint,
    CachePolicy,
    CacheScope,
    SchemaHash
} from 'apollo-server-types'
import {
    getIntrospectionQuery,
    IntrospectionQuery
} from 'graphql/utilities'
import {parse} from 'graphql/language'
import {execute} from 'graphql/execution'
import stableStringify from 'fast-json-stable-stringify'
import {InMemoryLRUCache} from 'apollo-server-caching'
import {OperationTypeNode} from 'graphql/language/ast'
import {createHash} from 'node:crypto'

let userServiceGraphQLServer: Server
let fruitsServiceGraphQLServer: Server
let dreamitGraphQLServer: Server
let apolloGateway: ApolloGateway

beforeAll(async() => {
    userServiceGraphQLServer = startGraphQLServer(
        'User Service',
        new GraphQLServer({
            schema: userSchema,
            rootValue: userSchemaResolvers,
            logger: USER_LOGGER,
            debug: false,

        }),
        USER_SERVICE_GRAPHQL_SERVER_PORT,
        USER_LOGGER
    ).listen({port: USER_SERVICE_GRAPHQL_SERVER_PORT})
    USER_LOGGER.info(`Starting User Service on port ${USER_SERVICE_GRAPHQL_SERVER_PORT}`)

    fruitsServiceGraphQLServer = startGraphQLServer(
        'Fruits Service',
        new GraphQLServer({
            schema: fruitsSchema,
            rootValue: fruitsSchemaResolvers,
            logger: FRUITS_LOGGER,
            debug: false,
        }),
        FRUITS_SERVICE_GRAPHQL_SERVER_PORT,
        FRUITS_LOGGER
    ).listen({port: FRUITS_SERVICE_GRAPHQL_SERVER_PORT})
    FRUITS_LOGGER.info(`Starting Fruits Service on port ${FRUITS_SERVICE_GRAPHQL_SERVER_PORT}`)

    apolloGateway = new ApolloGateway({
        supergraphSdl: new IntrospectAndCompose({
            subgraphs: [
                { name: 'user', url: `http://localhost:${USER_SERVICE_GRAPHQL_SERVER_PORT}/graphql`}
                // List of federation-capable GraphQL endpoints...
            ],
        }),
    })

    const loadResult = apolloGateway.load()
    GATEWAY_LOGGER.info(`Loaded gateway with result schema is ${JSON.stringify(loadResult)}`)

    const dummySchema = new GraphQLSchema({description:'dummyschema'})
    const gatewayGraphQLServer = new ApolloGatewayGraphQlServer({
        schema: dummySchema,
        rootValue: undefined,
        logger: GATEWAY_LOGGER,
        debug: true,
        shouldUpdateSchemaFunction: (): boolean => true,
        schemaValidationFunction: (): ReadonlyArray<GraphQLError> => [],
        validateFunction: (): ReadonlyArray<GraphQLError> => [],
        executeFunction: (arguments_: ExecutionArgs)
            : PromiseOrValue<ExecutionResult> => gatewayExecuteFunction(arguments_, apolloGateway)
    })
    dreamitGraphQLServer = startGraphQLServer(
        'Gateway Service',
        gatewayGraphQLServer,
        DREAMIT_GRAPHQL_SERVER_PORT,
        GATEWAY_LOGGER
    ).listen({port: DREAMIT_GRAPHQL_SERVER_PORT})
    GATEWAY_LOGGER.info(`Starting Gateway on port ${DREAMIT_GRAPHQL_SERVER_PORT}`)
})

afterAll(async() => {
    await userServiceGraphQLServer.close()
    await fruitsServiceGraphQLServer.close()
    await dreamitGraphQLServer.close()
    await apolloGateway.stop()
})

test('Should get correct result for users query', async() => {
    const response = await fetchResponse(
        USER_SERVICE_GRAPHQL_SERVER_PORT,
        `{"query":"${usersQuery}"}`
    )
    const responseObject = await response.json()
    expect(responseObject.data.users).toStrictEqual([userOne, userTwo, userThree])
})

test('Should get correct result for fruits query', async() => {
    const response = await fetchResponse(
        FRUITS_SERVICE_GRAPHQL_SERVER_PORT,
        `{"query":"${fruitsQuery}"}`
    )
    const responseObject = await response.json()
    expect(responseObject.data.fruits).toStrictEqual(fruitsArray)
})

test('Should get correct result for users query ' +
    'from apollo-gateway on dreamit-graphql-server', async() => {
    const response = await fetchResponse(
        DREAMIT_GRAPHQL_SERVER_PORT,
        `{"query":"${usersQuery}"}`
    )
    const responseObject = await response.json()
    expect(responseObject.data.users).toStrictEqual([userOne, userTwo, userThree])
})

function startGraphQLServer(
    serverIdentifier: string,
    graphqlServer: GraphQLServer,
    port: number,
    logger: Logger
): Express {
    const graphQLServerExpress = express()
    graphQLServerExpress.all('/graphql', (request, response) => {
        return graphqlServer.handleRequest(
            request as GraphQLServerRequest,
            response as GraphQLServerResponse
        )
    })
    return graphQLServerExpress
}

function gatewayExecuteFunction(
    arguments_: ExecutionArgs,
    gateway: ApolloGateway
): PromiseOrValue<ExecutionResult> {
    return gateway.executor({
        cache: new InMemoryLRUCache(),
        context: arguments_.contextValue,
        document: arguments_.document,
        logger: {
            debug(message?: any) {
                GATEWAY_LOGGER.debug(message)
            },
            info(message?: any) {
                GATEWAY_LOGGER.info(message)
            },
            warn(message?: any) {
                GATEWAY_LOGGER.warn(message)
            },
            error(message?: any) {
                GATEWAY_LOGGER.error(message, new Error('GatewayError'), 'GatewayError')
            }
        },
        metrics: {},
        operationName: arguments_.operationName || 'unknown',
        overallCachePolicy: newCachePolicy(),
        request: {},
        schema: gateway.schema!,
        schemaHash: generateSchemaHash(gateway.schema!),
        queryHash: '',
        source: '',
        operation: {
            kind: Kind.OPERATION_DEFINITION,
            operation: OperationTypeNode.QUERY,
            selectionSet: {
                kind:  Kind.SELECTION_SET,
                selections: []
            }
        }
    })
}

function newCachePolicy(): CachePolicy {
    return {
        maxAge: undefined,
        scope: undefined,
        restrict(hint: CacheHint): void {
            if (
                hint.maxAge !== undefined &&
                (this.maxAge === undefined || hint.maxAge < this.maxAge)
            ) {
                this.maxAge = hint.maxAge
            }
            if (hint.scope !== undefined && this.scope !== CacheScope.Private) {
                this.scope = hint.scope
            }
        },
        replace(hint: CacheHint): void {
            if (hint.maxAge !== undefined) {
                this.maxAge = hint.maxAge
            }
            if (hint.scope !== undefined) {
                this.scope = hint.scope
            }
        },
        policyIfCacheable(): Required<CacheHint> | null {
            if (this.maxAge === undefined || this.maxAge === 0) {
                return null
            }
            return { maxAge: this.maxAge, scope: this.scope ?? CacheScope.Public }
        },
    }
}

export function generateSchemaHash(schema: GraphQLSchema): SchemaHash {
    const introspectionQuery = getIntrospectionQuery()
    const document = parse(introspectionQuery)
    const result = execute({
        schema,
        document,
    }) as ExecutionResult<IntrospectionQuery>

    /*
     * If the execution of an introspection query results in a then-able, it
     * indicates that one or more of its resolvers is behaving in an asynchronous
     * manner.  This is not the expected behavior of a introspection query
     * which does not have any asynchronous resolvers.
     */
    if (
        result &&
        typeof (result as PromiseLike<typeof result>).then === 'function'
    ) {
        throw new Error(
            [
                'The introspection query is resolving asynchronously;' +
                ' execution of an introspection query is not expected to return a `Promise`.',
                '',
                'Wrapped type resolvers should maintain the existing execution dynamics' +
                ' of the resolvers they wrap (i.e. async vs sync) or introspection types should ' +
                'be excluded from wrapping by checking them ' +
                'with `graphql/type`s, `isIntrospectionType` predicate function prior to wrapping.',
            ].join('\n'),
        )
    }

    if (!result || !result.data || !result.data.__schema) {
        throw new Error('Unable to generate server introspection document.')
    }

    const introspectionSchema = result.data.__schema

    /*
     * It's important that we perform a deterministic stringification here
     * since, depending on changes in the underlying `graphql-js` execution
     * layer, varying orders of the properties in the introspection
     */
    const stringifiedSchema = stableStringify(introspectionSchema)
    return createHash('sha512')
    .update(stringifiedSchema)
    .digest('hex') as SchemaHash
}
