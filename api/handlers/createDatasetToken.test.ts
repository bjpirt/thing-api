process.env.JWT_SECRET = 'abc123'
const defaultUser = (process.env.DEFAULT_USER = 'testUser')
process.env.DEFAULT_PASSWORD_HASH = 'dummy'

import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb'
import { CreateDatasetToken } from 'api/types/DatasetToken'
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context
} from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import { createDatasetToken } from './createDatasetToken'

const ddbMock = mockClient(DynamoDBDocumentClient)

const execute = (
  id: string,
  dataset: CreateDatasetToken,
  user: string = defaultUser
): void | Promise<APIGatewayProxyResultV2> =>
  createDatasetToken(
    {
      body: JSON.stringify(dataset),
      pathParameters: { datasetId: id },
      requestContext: { authorizer: { user } }
    } as unknown as APIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDatasetToken', () => {
  beforeEach(() => {
    ddbMock.reset()
  })

  it("should return an error if the json won't parse", async () => {
    const result = await createDatasetToken(
      {
        body: 'notJson',
        pathParameters: { datasetId: 'foo' },
        requestContext: { authorizer: { user: defaultUser } }
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['JSON parsing error'] })
    })
  })

  it('should return a 401 error if the user is missing', async () => {
    const result = await createDatasetToken(
      {
        pathParameters: { datasetId: 'foo' }
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 401
    })
  })

  it('should return an error if the body is missing', async () => {
    const result = await createDatasetToken(
      {
        pathParameters: { datasetId: 'foo' },
        requestContext: { authorizer: { user: defaultUser } }
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Body is missing'] })
    })
  })

  it('should return an error if the dataset id is missing', async () => {
    const result = await createDatasetToken(
      {} as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })

  it('should return an error if attribute types are wrong', async () => {
    const result = await execute('datasetId', {
      name: 123,
      methods: ['GET']
    } as unknown as CreateDatasetToken)

    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({
        errors: ['Expected string, received number: name']
      })
    })
  })

  it('should return a 500 error if there is a dynamo error', async () => {
    ddbMock.on(TransactWriteCommand).rejects(new Error('Unknown error'))
    ddbMock.on(GetCommand).resolves({ Item: { user: defaultUser } })

    const result = await execute('datasetId', {
      name: 'TestToken',
      methods: ['GET', 'PUT']
    })

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })
})
