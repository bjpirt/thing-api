import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb'
import { mockDynamoDataset } from 'api/test/mocks'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import { APIGatewayProxyResultV2, Callback, Context } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import { deleteMetric } from './deleteMetric'

const ddbMock = mockClient(DynamoDBDocumentClient)

describe('deleteMetric', () => {
  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return a 401 error if the auth data is not set', async () => {
    const result = await deleteMetric(
      {} as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 401
    })
  })

  it('should return a 500 error if there is a dynamo error', async () => {
    const dataset = mockDynamoDataset()

    ddbMock.on(TransactWriteCommand).rejects(new Error('Unknown error'))
    ddbMock.on(GetCommand).resolves({ Item: dataset })

    const result = await deleteMetric(
      {
        pathParameters: { datasetId: dataset.id, metricId: 'metricOne' },
        requestContext: { authorizer: { lambda: { user: dataset.user } } }
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
    const result = await deleteMetric(
      {
        requestContext: { authorizer: { lambda: { user: 'user' } } }
      } as any as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify({ errors: ['Unknown server error'] })
    })
  })

  it('should return a 500 error if the metricId is missing', async () => {
    const result = await deleteMetric(
      {
        pathParameters: { datasetId: 'foo' },
        requestContext: { authorizer: { lambda: { user: 'user' } } }
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
