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
      queryStringParameters: { start, end }
    } as unknown as APIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDataset', () => {
  it('should return a 500 error if there is a dynamo error', async () => {
    mockQuery.mockRejectedValue(new Error('Unknown error'))

    const result = await execute(
      'datasetId',
      'metricId',
      '2022-01-01',
      '2022-01-02'
    )

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })
})
