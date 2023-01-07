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

import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context
} from 'aws-lambda'
import { UpdateDataset } from '../types/Dataset'
import { updateDataset } from './updateDataset'

const execute = (
  dataset: UpdateDataset
): void | Promise<APIGatewayProxyResultV2> =>
  updateDataset(
    {
      body: JSON.stringify(dataset),
      pathParameters: { datasetId: 'foo' }
    } as unknown as APIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDataset', () => {
  it('should return a 500 error if there is a dynamo error', async () => {
    mockTransactWrite.mockRejectedValue(new Error('Unknown error'))
    mockGet.mockResolvedValue({ Item: {} })

    const result = await execute({ name: 'Foo' } as unknown as UpdateDataset)

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })
})
