const mockTransactWrite = jest.fn()
const mockGet = jest.fn()
jest.mock('aws-sdk/clients/dynamodb', () => {
  return {
    DocumentClient: jest.fn(() => ({
      transactWrite: () => ({ promise: mockTransactWrite }),
      get: () => ({ promise: mockGet })
    }))
  }
})
jest.mock('aws-sdk', () => {
  return {
    DynamoDB: jest.fn()
  }
})

import { mockDynamoDataset, mockToken } from 'api/test/mocks'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import { APIGatewayProxyResultV2, Callback, Context } from 'aws-lambda'
import { deleteDatasetToken } from './deleteDatasetToken'

describe('deleteDatasetToken', () => {
  it('should return a 401 error if the user is not set', async () => {
    const result = await deleteDatasetToken(
      {} as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 401
    })
  })

  it('should return a 500 error if there is a dynamo error', async () => {
    const dataset = mockDynamoDataset({
      tokens: {
        abcde12345: mockToken()
      }
    })
    mockTransactWrite.mockRejectedValue(new Error('Unknown error'))
    mockGet.mockResolvedValue({ Item: dataset })

    const result = await deleteDatasetToken(
      {
        pathParameters: { datasetId: dataset.id, tokenId: 'abcde12345' },
        requestContext: { authorizer: { user: dataset.user } }
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
    const result = await deleteDatasetToken(
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

  it('should return a 500 error if the tokenId is missing', async () => {
    const result = await deleteDatasetToken(
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
})
