const mockGet = jest.fn()
jest.mock('aws-sdk/clients/dynamodb', () => {
  return {
    DocumentClient: jest.fn(() => ({
      get: () => ({ promise: mockGet })
    }))
  }
})
jest.mock('aws-sdk', () => {
  return {
    DynamoDB: jest.fn()
  }
})

import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import { APIGatewayProxyResultV2, Callback, Context } from 'aws-lambda'
import { getDatasetTokens } from './getDatasetTokens'

describe('getDatasetTokens', () => {
  it('should return a 401 error if the user is not set', async () => {
    const result = await getDatasetTokens(
      {} as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 401
    })
  })

  it('should return a 500 error if there is a dynamo error', async () => {
    mockGet.mockRejectedValue(new Error('Unknown error'))

    const result = await getDatasetTokens(
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
    const result = await getDatasetTokens(
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
