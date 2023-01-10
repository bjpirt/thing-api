import { mockDynamoDataset } from 'api/test/mocks'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import { OutputDataset } from 'api/types/Dataset'
import {
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
  Callback,
  Context
} from 'aws-lambda'
import createDynamoConfig from '../lib/createDynamoConfig'
import { clearDynamoTable, createItem } from '../test/dynamoHelpers'
import { getDatasets } from './getDatasets'

const { dynamoTables } = createDynamoConfig(process.env)

const execute = (user: string): void | Promise<APIGatewayProxyResultV2> =>
  getDatasets(
    {
      requestContext: { authorizer: { user } }
    } as CustomAPIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDataset', () => {
  beforeEach(async () => {
    await clearDynamoTable(dynamoTables.datasetsTable)
  })

  it('should only list datasets for the current user', async () => {
    const dataset1 = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset1)
    const dataset2 = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset2)
    const dataset3 = mockDynamoDataset({ user: 'notTheUser' })
    await createItem(dynamoTables.datasetsTable, dataset3)

    const result = (await execute(
      dataset1.user
    )) as APIGatewayProxyStructuredResultV2

    const { statusCode, body } = result
    expect(statusCode).toBe(200)

    const datasets = JSON.parse(body!) as { datasets: OutputDataset[] }
    expect(datasets.datasets).toHaveLength(2)
    const datasetIds = datasets.datasets.map((d) => d.id)
    expect(datasetIds).toContain(dataset1.id)
    expect(datasetIds).toContain(dataset2.id)
  })
})
