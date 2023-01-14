import { mockDynamoDataset } from 'api/test/mocks'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import {
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
  Callback,
  Context
} from 'aws-lambda'
import createDynamoConfig from '../lib/createDynamoConfig'
import { clearDynamoTable, createItem } from '../test/dynamoHelpers'
import { getDatasetTokens } from './getDatasetTokens'

const { dynamoTables } = createDynamoConfig(process.env)

const execute = (
  user: string,
  datasetId: string
): void | Promise<APIGatewayProxyResultV2> =>
  getDatasetTokens(
    {
      pathParameters: { datasetId },
      requestContext: { authorizer: { user } }
    } as any as CustomAPIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('getDatasetTokens', () => {
  beforeEach(async () => {
    await clearDynamoTable(dynamoTables.datasetsTable)
  })

  it('should get the dataset', async () => {
    const dataset = mockDynamoDataset({
      tokens: {
        abcde12345: {
          name: 'test',
          createdAt: new Date().toISOString(),
          methods: ['GET', 'POST']
        }
      }
    })
    await createItem(dynamoTables.datasetsTable, dataset)

    const result = (await execute(
      dataset.user,
      dataset.id
    )) as APIGatewayProxyStructuredResultV2

    const { statusCode, body } = result
    expect(statusCode).toBe(200)

    const retrievedTokens = JSON.parse(body!)
    expect(retrievedTokens.tokens).toStrictEqual([
      {
        id: 'abcde12345',
        ...dataset.tokens.abcde12345
      }
    ])
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
