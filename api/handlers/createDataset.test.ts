const mockTransactWrite = jest.fn()
jest.mock('aws-sdk/clients/dynamodb', () => {
  return {
    DocumentClient: jest.fn(() => ({
      transactWrite: () => ({ promise: mockTransactWrite })
    }))
  }
})
jest.mock('aws-sdk', () => {
  return {
    DynamoDB: jest.fn()
  }
})

import { mockCreateDataset } from 'api/test/mocks'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import { APIGatewayProxyResultV2, Callback, Context } from 'aws-lambda'
import { CreateDataset } from '../types/Dataset'
import { createDataset } from './createDataset'

const execute = (
  dataset: CreateDataset
): void | Promise<APIGatewayProxyResultV2> =>
  createDataset(
    {
      body: JSON.stringify(dataset),
      requestContext: { authorizer: { user: 'test' } }
    } as CustomAPIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDataset', () => {
  it('should return a 500 error if there is a dynamo error', async () => {
    const dataset = mockCreateDataset()

    mockTransactWrite.mockRejectedValue(new Error('Unknown error'))

    const result = await execute(dataset)

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })
})
