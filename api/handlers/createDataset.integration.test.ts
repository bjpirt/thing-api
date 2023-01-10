import { mockCreateDataset } from 'api/test/mocks'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import { APIGatewayProxyResultV2, Callback, Context } from 'aws-lambda'
import createDynamoConfig from '../lib/createDynamoConfig'
import { clearDynamoTable, getAll } from '../test/dynamoHelpers'
import { CreateDataset } from '../types/Dataset'
import { createDataset } from './createDataset'

const { dynamoTables } = createDynamoConfig(process.env)

const execute = (
  dataset: CreateDataset
): void | Promise<APIGatewayProxyResultV2> =>
  createDataset(
    {
      body: JSON.stringify(dataset),
      requestContext: { authorizer: { user: 'test' } }
    } as CustomAPIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDataset', () => {
  beforeEach(async () => {
    await clearDynamoTable(dynamoTables.datasetsTable)
  })

  it('should create a dataset and redirect', async () => {
    const dataset = mockCreateDataset()

    const result = await execute(dataset)

    const [record] = await getAll(dynamoTables.datasetsTable)
    expect(record.name).toEqual(dataset.name)
    expect(record.description).toEqual(dataset.description)
    expect(record.metrics).toStrictEqual(dataset.metrics)
    expect(record).toHaveProperty('id')
    expect(record).toHaveProperty('createdAt')
    expect(record).toHaveProperty('updatedAt')

    expect(result).toStrictEqual({
      statusCode: 201,
      headers: { Location: `/datasets/${record.id}` }
    })
  })
})
