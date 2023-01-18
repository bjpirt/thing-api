import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context
} from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import { UpdateDataset } from '../types/Dataset'
import { updateDataset } from './updateDataset'

const ddbMock = mockClient(DynamoDBDocumentClient)

const execute = (
  dataset: UpdateDataset
): void | Promise<APIGatewayProxyResultV2> =>
  updateDataset(
    {
      body: JSON.stringify(dataset),
      pathParameters: { datasetId: 'foo' },
      requestContext: { authorizer: { lambda: { user: 'testUser' } } }
    } as unknown as APIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('updateDataset', () => {
  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return a 500 error if there is a dynamo error', async () => {
    ddbMock.on(TransactWriteCommand).rejects(new Error('Unknown error'))
    ddbMock.on(GetCommand).resolves({ Item: { user: 'testUser' } })

    const result = await execute({ name: 'Foo' } as unknown as UpdateDataset)

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })

  it('should return a 500 error if the dataset ID is missing', async () => {
    const result = await updateDataset(
      {
        body: '{}',
        pathParameters: {},
        requestContext: { authorizer: { lambda: { user: 'testUser' } } }
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })

  it('should return a 401 error if the auth data is missing', async () => {
    const result = await updateDataset(
      {
        body: '{}',
        pathParameters: {}
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({ statusCode: 401 })
  })

  it("should return an error if the json won't parse", async () => {
    const result = await updateDataset(
      {
        body: 'notJson',
        pathParameters: { datasetId: 'foo' },
        requestContext: { authorizer: { lambda: { user: 'testUser' } } }
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['JSON parsing error'] })
    })
  })

  it('should return an error if the body is missing', async () => {
    const result = await updateDataset(
      {
        pathParameters: { datasetId: 'foo' },
        requestContext: { authorizer: { lambda: { user: 'testUser' } } }
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Body is missing'] })
    })
  })

  it('should return an error if attribute types are wrong', async () => {
    const result = await execute({ name: 123 } as unknown as UpdateDataset)

    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({
        errors: ['Expected string, received number: name']
      })
    })
  })
})
