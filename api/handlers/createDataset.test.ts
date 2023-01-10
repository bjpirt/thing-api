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
  it("should return an error if the json won't parse", async () => {
    const result = await createDataset(
      {
        body: 'notJson',
        requestContext: { authorizer: { user: 'test' } }
      } as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['JSON parsing error'] })
    })
  })

  it('should return an error if the body is missing', async () => {
    const result = await createDataset(
      {
        requestContext: { authorizer: { user: 'test' } }
      } as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Body is missing'] })
    })
  })

  it('should return an error if required attributes are missing', async () => {
    const dataset = mockCreateDataset({ name: undefined })

    const result = await execute(dataset)

    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Missing attribute: name'] })
    })
  })

  it('should return an error if the metric ids are invalid', async () => {
    const dataset = mockCreateDataset({ metrics: { 'metric one': {} } })

    const result = await execute(dataset)

    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({
        errors: [
          'Metric id must be alphanumeric (a-z, A-Z, 0-9, -, _) with no spaces'
        ]
      })
    })
  })

  it('should return an error if attributes are the wrong type', async () => {
    const dataset = mockCreateDataset({ name: 10 } as unknown as CreateDataset)

    const result = await execute(dataset)

    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({
        errors: ['Expected string, received number: name']
      })
    })
  })

  it('should return a 500 error if there is a dynamo error', async () => {
    const dataset = mockCreateDataset()

    mockTransactWrite.mockRejectedValue(new Error('Unknown error'))

    const result = await execute(dataset)

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })

  it('should return a 401 error if the user is not set', async () => {
    const result = await createDataset(
      {} as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 401
    })
  })
})
