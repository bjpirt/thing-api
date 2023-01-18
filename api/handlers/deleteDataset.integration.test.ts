import { mockDynamoDataset } from 'api/test/mocks'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import {
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
  Callback,
  Context
} from 'aws-lambda'
import createDynamoConfig from '../lib/createDynamoConfig'
import { clearDynamoTable, createItem, getAll } from '../test/dynamoHelpers'
import { deleteDataset } from './deleteDataset'

const { dynamoTables } = createDynamoConfig(process.env)

const execute = (
  datasetId: string,
  user: string
): void | Promise<APIGatewayProxyResultV2> =>
  deleteDataset(
    {
      pathParameters: { datasetId },
      requestContext: { authorizer: { lambda: { user } } }
    } as any as CustomAPIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('deleteDataset', () => {
  beforeEach(async () => {
    await clearDynamoTable(dynamoTables.datasetsTable)
  })

  it('should delete the dataset', async () => {
    const dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)
    const beforeCount = await getAll(dynamoTables.datasetsTable)
    expect(beforeCount).toHaveLength(1)

    const result = (await execute(
      dataset.id,
      dataset.user
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 204)
    const afterCount = await getAll(dynamoTables.datasetsTable)
    expect(afterCount).toHaveLength(0)
  })

  it('should delete the dataset with a valid dataset auth token', async () => {
    const dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)
    const beforeCount = await getAll(dynamoTables.datasetsTable)
    expect(beforeCount).toHaveLength(1)

    const result = await deleteDataset(
      {
        pathParameters: { datasetId: dataset.id },
        requestContext: { authorizer: { lambda: { datasetId: dataset.id } } }
      } as any as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toHaveProperty('statusCode', 204)
  })

  it('should return a 404 if the dataset does not exist', async () => {
    const result = (await execute(
      'foo',
      'foo'
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 404)
  })

  it('should return a 404 if the dataset does not belong to the user', async () => {
    const dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)
    const beforeCount = await getAll(dynamoTables.datasetsTable)
    expect(beforeCount).toHaveLength(1)

    const result = (await execute(
      dataset.id,
      'wronguser'
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 404)
    const afterCount = await getAll(dynamoTables.datasetsTable)
    expect(afterCount).toHaveLength(1)
  })
})
