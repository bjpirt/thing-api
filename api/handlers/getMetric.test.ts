import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context
} from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import { getMetric } from './getMetric'

const ddbMock = mockClient(DynamoDBDocumentClient)

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

describe('getMetric', () => {
  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return a 500 error if there is a dynamo error fetching the dataset', async () => {
    ddbMock.on(GetCommand).rejects(new Error('Unknown error'))

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
    ddbMock.on(QueryCommand).rejects(new Error('Unknown error'))
    ddbMock.on(GetCommand).resolves({
      Item: { user: 'testUser', metrics: { metricOne: {} } }
    })

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
