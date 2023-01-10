const mockQuery = jest.fn()
jest.mock('aws-sdk/clients/dynamodb', () => {
  return {
    DocumentClient: jest.fn(() => ({
      query: () => ({ promise: mockQuery })
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
import { getDatasets } from './getDatasets'

describe('createDataset', () => {
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
    mockQuery.mockRejectedValue(new Error('Unknown error'))

    const result = await getDatasets(
      {
        requestContext: { authorizer: { user: 'user' } }
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
