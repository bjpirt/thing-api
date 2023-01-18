import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import { APIGatewayProxyResultV2, Callback, Context } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import { getDatasets } from './getDatasets'

const ddbMock = mockClient(DynamoDBDocumentClient)

describe('getDatasets', () => {
  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return a 401 error if the user is not set', async () => {
    const result = await getDatasets(
      {} as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 401
    })
  })

  it('should return a 500 error if there is a dynamo error', async () => {
    ddbMock.on(QueryCommand).rejects(new Error('Unknown error'))

    const result = await getDatasets(
      {
        requestContext: { authorizer: { lambda: { user: 'user' } } }
      } as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })
})
