import { mockDynamoDataset, mockToken } from 'api/test/mocks'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import {
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
  Callback,
  Context
} from 'aws-lambda'
import createDynamoConfig from '../lib/createDynamoConfig'
import { clearDynamoTable, createItem, getOne } from '../test/dynamoHelpers'
import { deleteDatasetToken } from './deleteDatasetToken'

const { dynamoTables } = createDynamoConfig(process.env)

const execute = (
  datasetId: string,
  tokenId: string,
  user: string
): void | Promise<APIGatewayProxyResultV2> =>
  deleteDatasetToken(
    {
      pathParameters: { datasetId, tokenId },
      requestContext: { authorizer: { lambda: { user } } }
    } as any as CustomAPIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('deleteDatasetToken', () => {
  beforeEach(async () => {
    await clearDynamoTable(dynamoTables.datasetsTable)
  })

  it('should delete the metric', async () => {
    const dataset = mockDynamoDataset({
      tokens: {
        abcde12345: mockToken(),
        fghij12345: mockToken()
      }
    })
    await createItem(dynamoTables.datasetsTable, dataset)
    const before = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(before!.tokens).toHaveProperty('fghij12345')

    const result = (await execute(
      dataset.id,
      'fghij12345',
      dataset.user
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 204)

    const after = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(after!.tokens).not.toHaveProperty('fghij12345')
  })

  it('should return a 404 if the dataset does not exist', async () => {
    const result = (await execute(
      'dataset',
      'token',
      'user'
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 404)
  })

  it('should return a 404 if the dataset does not belong to the user', async () => {
    const dataset = mockDynamoDataset({ tokens: { tokenOne: mockToken() } })
    await createItem(dynamoTables.datasetsTable, dataset)
    const before = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(before!.tokens).toHaveProperty('tokenOne')

    const result = (await execute(
      dataset.id,
      'tokenOne',
      'wronguser'
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 404)
    const after = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(after!.tokens).toHaveProperty('tokenOne')
  })

  it('should return a 404 if the token does not exist', async () => {
    const dataset = mockDynamoDataset({ tokens: { tokenOne: mockToken() } })
    await createItem(dynamoTables.datasetsTable, dataset)
    const before = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(before!.tokens).toHaveProperty('tokenOne')

    const result = (await execute(
      dataset.id,
      'tokenNine',
      dataset.user
    )) as APIGatewayProxyStructuredResultV2

    expect(result).toHaveProperty('statusCode', 404)
    const after = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(after!.tokens).toHaveProperty('tokenOne')
  })
})
