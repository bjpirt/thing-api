import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'

export type DynamoConfig = {
  dynamoConfig: DynamoDBClientConfig
  dynamoTables: {
    metricsTable: string
    datasetsTable: string
  }
}

const createDynamoConfig = (env: NodeJS.ProcessEnv): DynamoConfig => {
  const dynamoConfig: DynamoDBClientConfig = {}
  let metricsTable = env.METRICS_TABLE
  let datasetsTable = env.DATASETS_TABLE

  if (env.IS_OFFLINE || env.JEST_WORKER_ID) {
    dynamoConfig.region = 'localhost'
    dynamoConfig.endpoint = 'http://localhost:8000'
    dynamoConfig.credentials = {
      accessKeyId: 'AWS_ACCESS_KEY_ID',
      secretAccessKey: 'AWS_SECRET_ACCESS_KEY'
    }
    if (env.JEST_WORKER_ID) {
      metricsTable = 'thing-api-dev-metrics'
      datasetsTable = 'thing-api-dev-datasets'
    }
  }

  if (!datasetsTable || !metricsTable) {
    throw new Error(
      'METRICS_TABLE and DATASETS_TABLE environment variables must be set'
    )
  }
  return { dynamoConfig, dynamoTables: { metricsTable, datasetsTable } }
}

export default createDynamoConfig
