import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import createDynamoConfig from './createDynamoConfig'

const createDocumentClient = (
  env: NodeJS.ProcessEnv
): DynamoDBDocumentClient => {
  const { dynamoConfig } = createDynamoConfig(env)

  const from = DynamoDBDocumentClient.from
  return from(new DynamoDBClient(dynamoConfig))
}

export default createDocumentClient
