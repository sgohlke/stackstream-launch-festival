import {GraphQLServer} from '@dreamit/graphql-server'
import {GraphQLSchema} from 'graphql'

export class ApolloGatewayGraphQlServer extends GraphQLServer {
    isValidSchema(schema?: GraphQLSchema): boolean {
        return true
    }
}
