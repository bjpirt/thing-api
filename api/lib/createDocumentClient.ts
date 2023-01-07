import { DynamoDB } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import createDynamoConfig from './createDynamoConfig'

const createDocumentClient = (env: NodeJS.ProcessEnv): DocumentClient => {
  const { dynamoConfig } = createDynamoConfig(env)
  return new DocumentClient({
    service: new DynamoDB(dynamoConfig)
  })
}

export default createDocumentClient
