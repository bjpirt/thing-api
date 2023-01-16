const mockQuery = jest.fn()
const mockGet = jest.fn()
jest.mock('aws-sdk/clients/dynamodb', () => {
  return {
    DocumentClient: jest.fn(() => ({
      query: () => ({ promise: mockQuery }),
      get: () => ({ promise: mockGet })
    }))
  }
})
jest.mock('aws-sdk', () => {
  return {
    DynamoDB: jest.fn()
  }
})

import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context
} from 'aws-lambda'
import { getMetric } from './getMetric'

const execute = (
  datasetId: string,
  metricId: string,
  start: string,
  end: string
): Promise<APIGatewayProxyResultV2> =>
  getMetric(
    {
      pathParameters: { datasetId, metricId },
      queryStringParameters: { start, end },
      requestContext: { authorizer: { user: 'testUser' } }
    } as unknown as APIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDataset', () => {
  it('should return a 500 error if there is a dynamo error fetching the dataset', async () => {
    mockGet.mockRejectedValue(new Error('Unknown error'))

    const result = await execute(
      'datasetId',
      'metricOne',
      '2022-01-01',
      '2022-01-02'
    )

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })

  it('should return a 500 error if there is a dynamo error fetching metrics', async () => {
    mockGet.mockResolvedValue({
      Item: { user: 'testUser', metrics: { metricOne: {} } }
    })
    mockQuery.mockRejectedValue(new Error('Unknown error'))

    const result = await execute(
      'datasetId',
      'metricOne',
      '2022-01-01',
      '2022-01-02'
    )

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })

  it('should return a 500 error if the dataset ID is missing', async () => {
    const result = await execute(
      undefined as any as string,
      'metricId',
      '2022-01-01',
      '2022-01-02'
    )

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })

  it('should return a 401 error if the auth data is missing', async () => {
    const result = await getMetric(
      {
        pathParameters: { datasetId: 'foo', metricId: 'bar' }
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 401
    })
  })
})
