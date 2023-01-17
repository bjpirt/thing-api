import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import { APIGatewayProxyResultV2, Callback, Context } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import { getDataset } from './getDataset'

const ddbMock = mockClient(DynamoDBDocumentClient)

describe('getDataset', () => {
  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return a 401 error if the auth data is not set', async () => {
    const result = await getDataset(
      {} as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 401
    })
  })

  it('should return a 500 error if there is a dynamo error', async () => {
    ddbMock.on(GetCommand).rejects(new Error('Unknown error'))

    const result = await getDataset(
      {
        pathParameters: { datasetId: 'foo' },
        requestContext: { authorizer: { user: 'user' } }
      } as any as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })

  it('should return a 500 error if the datasetId is missing', async () => {
    const result = await getDataset(
      {
        requestContext: { authorizer: { user: 'user' } }
      } as any as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })
})
