import {
    buildSchema,
    GraphQLError,
    GraphQLSchema
} from 'graphql'
import {
    GraphQLRequestInfo
} from '@dreamit/graphql-server'

// Contains example schemas and data that can be used across tests

export interface SDL {
    sdl: string
}

export interface User {
    userId: string
    userName: string
}

export interface Fruit {
    fruitId: string
    fruitLabel: string
}

export interface LogoutResult {
    result: string
}

export const initialSchemaWithOnlyDescription = new GraphQLSchema({description:'initial'})

export const userOne: User = {userId: '1', userName:'Robert'}
export const userTwo: User = {userId: '2', userName:'Paul'}
export const userThree: User = {userId: '3', userName:'Samantha'}

export const avocado: Fruit = {fruitId: '1', fruitLabel:'Avocado'}
export const blutorange: Fruit = {fruitId: '2', fruitLabel:'Blutorange'}
export const feige: Fruit = {fruitId: '3', fruitLabel:'Feige'}
export const himbeere: Fruit = {fruitId: '4', fruitLabel:'Himbeere'}
export const mango: Fruit = {fruitId: '5', fruitLabel:'Mango'}
export const pfirsich: Fruit = {fruitId: '6', fruitLabel:'Pfirsich'}

export const johannisbeere: Fruit = {fruitId: '7', fruitLabel:'Johannisbeere'}
export const kirsche: Fruit = {fruitId: '8', fruitLabel:'Avocado'}
export const stachelbeere: Fruit = {fruitId: '9', fruitLabel:'Stachelbeere'}
export const zitrone: Fruit = {fruitId: '10', fruitLabel:'Zitrone'}
export const weintrauben: Fruit = {fruitId: '11', fruitLabel:'Weintrauben'}
export const wassermelone: Fruit = {fruitId: '12', fruitLabel:'Wassermelone'}

export const pippilotta: Fruit = {fruitId: '13', fruitLabel:'Pippilotta'}
export const viktualia: Fruit = {fruitId: '14', fruitLabel:'Viktualia'}
export const rollgardina: Fruit = {fruitId: '15', fruitLabel:'Rollgardina'}
export const pfefferminz: Fruit = {fruitId: '16', fruitLabel:'Pfefferminz'}
export const efraimstochter: Fruit = {fruitId: '17', fruitLabel:'Efraimstochter'}
export const langstrumpf: Fruit = {fruitId: '18', fruitLabel:'Langstrumpf'}

export const fruitsArray: Array<Fruit> = [avocado,
    blutorange,
    feige,
    himbeere,
    mango,
    pfirsich,
    johannisbeere,
    kirsche,
    stachelbeere,
    zitrone,
    weintrauben,
    wassermelone,
    pippilotta,
    viktualia,
    rollgardina,
    pfefferminz,
    efraimstochter,
    langstrumpf]

export const userQuery = 'query user($id201: String!){ user(id: $id201) { userId userName } }'
export const userVariables = '{"id201":"1"}'
export const usersQuery = 'query users{ users { userId userName } }'
export const fruitsQuery = 'query fruits{ fruits { fruitId fruitLabel } }'
export const usersQueryWithUnknownField = 'query users{ users { userId userName hobby } }'
export const returnErrorQuery = 'query returnError{ returnError { userId } }'
export const loginMutation =
    'mutation login{ login(userName:"magic_man", password:"123456") { jwt } }'
export const logoutMutation = 'mutation logout{ logout { result } }'
export const introspectionQuery = 'query introspection{ __schema { queryType { name } } }'

export const usersRequest: GraphQLRequestInfo = {
    query: usersQuery,
    operationName: 'users',
}
export const loginRequest: GraphQLRequestInfo = {
    query: loginMutation,
    operationName: 'login'
}
export const usersRequestWithoutOperationName: GraphQLRequestInfo = {
    query: usersRequest.query,
}
export const usersRequestWithoutVariables: GraphQLRequestInfo = {
    query: usersRequest.query,
    operationName: usersRequest.operationName
}

export const userSchemaSDL = `
  schema {
    query: Query
    mutation: Mutation
  }
  
  type Query {
    returnError: User 
    users: [User]
    user(id: String!): User
    _service: SDL
  }
  
  type Mutation {
    login(userName: String, password: String): LoginData
    logout: LogoutResult
  }
  
  type SDL {
    sdl: String
  }
  
  type User {
    userId: String
    userName: String
  }
  
  type LoginData {
    jwt: String
  }
  
  type LogoutResult {
    result: String
  }
`


export const userSchema = buildSchema(userSchemaSDL)

export const fruitsSchema = buildSchema(`
  schema {
    query: Query
  }
  
  type Query {
    fruits: [Fruits]
  }
  
  type Fruits {
    fruitId: String
    fruitLabel: String
  }
`)

export const userSchemaResolvers= {
    users(): User[] {
        return [userOne, userTwo, userThree]
    },
    user(input: { id: string }): User {
        switch (input.id) {
        case '1':
            return userOne
        case '2':
            return userTwo
        case '3':
            return userThree
        default:
            throw new GraphQLError(`User for userid=${input.id} was not found`, {})
        }
    },
    logout(): LogoutResult {
        return {result: 'Goodbye!'}
    },
    _service(): SDL {
        return {sdl: userSchemaSDL}
    }
}

export const fruitsSchemaResolvers= {
    fruits(): Fruit[] {
        return fruitsArray
    }
}


