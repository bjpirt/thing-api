const jwtSecret = (process.env.JWT_SECRET = 'abc123')
const defaultUser = (process.env.DEFAULT_USER = 'testUser')
process.env.DEFAULT_PASSWORD_HASH = 'dummy'

import { mockDynamoDataset } from 'api/test/mocks'
import { CreateDatasetToken } from 'api/types/DatasetToken'
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context
} from 'aws-lambda'
import createDynamoConfig from '../lib/createDynamoConfig'
import { createItem, getOne } from '../test/dynamoHelpers'
import { DynamoDataset } from '../types/Dataset'
import { createDatasetToken } from './createDatasetToken'
import jwt from 'jsonwebtoken'

const { dynamoTables } = createDynamoConfig(process.env)

const execute = (
  id: string,
  dataset: CreateDatasetToken,
  user: string = defaultUser
): void | Promise<APIGatewayProxyResultV2> =>
  createDatasetToken(
    {
      body: JSON.stringify(dataset),
      pathParameters: { datasetId: id },
      requestContext: { authorizer: { lambda: { user } } }
    } as unknown as APIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDataset', () => {
  let dataset: DynamoDataset

  beforeEach(async () => {
    dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)
  })

  it('should create a new token with the correct details', async () => {
    const result = await execute(dataset.id, {
      name: 'TestToken',
      methods: ['GET', 'PUT']
    })
    expect(result).toHaveProperty('statusCode', 200)

    const token = JSON.parse((result as any).body).token
    const payload = jwt.verify(token, jwtSecret)
    expect(payload).toHaveProperty('scope', 'dataset')
    expect(payload).toHaveProperty('datasetId', dataset.id)
    expect(payload).toHaveProperty('methods', ['GET', 'PUT'])
    expect(payload).not.toHaveProperty('exp')

    const dynamoRecord = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(dynamoRecord!.tokens).toHaveProperty((payload as any).tokenId)

    const dynamoToken = dynamoRecord!.tokens[(payload as any).tokenId]
    expect(dynamoToken).toHaveProperty('methods', ['GET', 'PUT'])
    expect(dynamoToken).toHaveProperty('name', 'TestToken')
    expect(dynamoToken).toHaveProperty('createdAt')
  })

  it('should return a 404 if the dataset does not exist', async () => {
    const result = await execute('badId', {
      name: 'foo',
      methods: ['GET']
    } as CreateDatasetToken)
    expect(result).toStrictEqual({
      statusCode: 404
    })
  })

  it('should return a 404 if the user does not match the dataset', async () => {
    const result = await execute(
      dataset.id,
      {
        name: 'foo',
        methods: ['GET']
      } as CreateDatasetToken,
      'wrongUser'
    )
    expect(result).toStrictEqual({
      statusCode: 404
    })
  })
})
