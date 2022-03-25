import {GraphQLServer, GraphQLServerOptions, JsonLogger} from "@dreamit/graphql-server";
import {userAndFruitsSchema, userAndFruitsSchemaResolvers, userSchema, userSchemaResolvers} from "./ExampleSchemas";
import express from 'express';
import {NoSchemaIntrospectionCustomRule} from "graphql";

const graphQLServerPort = 3592
const logger = new JsonLogger('test-logger', 'launchFestivalService')
const initialGraphQLServerOptions: GraphQLServerOptions = {
    schema: userSchema,
    rootValue: userSchemaResolvers,
    logger: logger,
    debug: false,
}
const introspectionDisabledGraphQLServerOptions: GraphQLServerOptions = {
    schema: userSchema,
    rootValue: userSchemaResolvers,
    logger: logger,
    debug: false,
    customValidationRules: [NoSchemaIntrospectionCustomRule]}

const fruitsGraphQLServerOptions: GraphQLServerOptions = {
    schema: userAndFruitsSchema,
    rootValue: userAndFruitsSchemaResolvers,
    logger: logger,
    debug: false,
}

let customGraphQLServer;
let introspectionEnabledToggle = true;
let enableFruitSchemaToggle = true;

const graphQLServerExpress = express()
customGraphQLServer = new GraphQLServer(initialGraphQLServerOptions)
graphQLServerExpress.all('/graphql', (req, res) => {
    return customGraphQLServer.handleRequest(req, res)
})

graphQLServerExpress.get('/metrics', async (req, res) => {
    return res.contentType(customGraphQLServer.getMetricsContentType()).send(await customGraphQLServer.getMetrics());
})

graphQLServerExpress.get('/toggleIntrospection', (req, res) => {
    if (introspectionEnabledToggle) {
        customGraphQLServer.setOptions(initialGraphQLServerOptions)
        introspectionEnabledToggle = false
    } else {
        customGraphQLServer.setOptions(introspectionDisabledGraphQLServerOptions)
        introspectionEnabledToggle = true
    }
    return res.status(200).send(introspectionEnabledToggle);
})

graphQLServerExpress.get('/toggleSchema', (req, res) => {
    if (enableFruitSchemaToggle) {
        customGraphQLServer.setOptions(fruitsGraphQLServerOptions)
        enableFruitSchemaToggle = false
    } else {
        customGraphQLServer.setOptions(initialGraphQLServerOptions)
        enableFruitSchemaToggle = true
    }
    return res.status(200).send(enableFruitSchemaToggle);
})

graphQLServerExpress.listen({port: graphQLServerPort})
console.info(`Starting GraphQL server on port ${graphQLServerPort}`)
