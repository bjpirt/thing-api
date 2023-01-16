import { mockDynamoDataset } from 'api/test/mocks'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import {
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
  Callback,
  Context
} from 'aws-lambda'
import createDynamoConfig from '../lib/createDynamoConfig'
import { clearDynamoTable, createItem, getOne } from '../test/dynamoHelpers'
import { deleteMetric } from './deleteMetric'

const { dynamoTables } = createDynamoConfig(process.env)

const execute = (
  datasetId: string,
  metricId: string,
  user: string
): void | Promise<APIGatewayProxyResultV2> =>
  deleteMetric(
    {
      pathParameters: { datasetId, metricId },
      requestContext: { authorizer: { user } }
    } as any as CustomAPIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('deleteMetric', () => {
  beforeEach(async () => {
    await clearDynamoTable(dynamoTables.datasetsTable)
  })

  it('should delete the metric', async () => {
    const dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)
    const before = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(before!.metrics).toHaveProperty('metricOne')

    const result = (await execute(
      dataset.id,
      'metricOne',
      dataset.user
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 204)

    const after = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(after!.metrics).not.toHaveProperty('metricOne')
  })

  it('should delete the metric with a dataset token', async () => {
    const dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)

    const result = await deleteMetric(
      {
        pathParameters: { datasetId: dataset.id, metricId: 'metricOne' },
        requestContext: { authorizer: { datasetId: dataset.id } }
      } as any as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toHaveProperty('statusCode', 204)
  })

  it('should return a 404 if the dataset does not exist', async () => {
    const result = (await execute(
      'dataset',
      'metric',
      'user'
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 404)
  })

  it('should return a 404 if the dataset does not belong to the user', async () => {
    const dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)
    const before = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(before!.metrics).toHaveProperty('metricOne')

    const result = (await execute(
      dataset.id,
      'metricOne',
      'wronguser'
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 404)
    const after = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(after!.metrics).toHaveProperty('metricOne')
  })

  it('should return a 404 if the metric does not exist', async () => {
    const dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)
    const before = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(before!.metrics).toHaveProperty('metricOne')

    const result = (await execute(
      dataset.id,
      'metricNine',
      dataset.user
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 404)
    const after = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(after!.metrics).toHaveProperty('metricOne')
  })
})
