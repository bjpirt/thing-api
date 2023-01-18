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
import { getDataset } from './getDataset'

const { dynamoTables } = createDynamoConfig(process.env)

const execute = (
  user: string,
  datasetId: string
): void | Promise<APIGatewayProxyResultV2> =>
  getDataset(
    {
      pathParameters: { datasetId },
      requestContext: { authorizer: { lambda: { user } } }
    } as any as CustomAPIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('getDataset', () => {
  beforeEach(async () => {
    await clearDynamoTable(dynamoTables.datasetsTable)
  })

  it('should get the dataset', async () => {
    const dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)

    const result = (await execute(
      dataset.user,
      dataset.id
    )) as APIGatewayProxyStructuredResultV2

    const { statusCode, body } = result
    expect(statusCode).toBe(200)

    const retrievedDataset = JSON.parse(body!) as OutputDataset
    expect(retrievedDataset.id).toEqual(dataset.id)
  })

  it('should get the dataset with a dataset token', async () => {
    const dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)

    const result = await getDataset(
      {
        pathParameters: { datasetId: dataset.id },
        requestContext: { authorizer: { lambda: { datasetId: dataset.id } } }
      } as any as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toHaveProperty('statusCode', 200)
  })

  it('should return a 404 if the dataset does not exist', async () => {
    const result = (await execute(
      'dummy',
      'dummy'
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 404)
  })

  it('should return a 404 if the dataset does not belong to the user', async () => {
    const dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)

    const result = (await execute(
      'wronguser',
      dataset.id
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 404)
  })
})
