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
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context
} from 'aws-lambda'
import { CreateDataset } from '../types/Dataset'
import { createDataset } from './createDataset'

const execute = (
  dataset: CreateDataset
): void | Promise<APIGatewayProxyResultV2> =>
  createDataset(
    { body: JSON.stringify(dataset) } as APIGatewayProxyEventV2,
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
