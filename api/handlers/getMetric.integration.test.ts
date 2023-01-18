import createDocumentClient from 'api/lib/createDocumentClient'
import DynamoGateway from 'api/lib/DynamoGateway'
import { isoToEpoch } from 'api/lib/time'
import { mockDynamoDataset } from 'api/test/mocks'
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
  Callback,
  Context
} from 'aws-lambda'
import createDynamoConfig from '../lib/createDynamoConfig'
import { createItem } from '../test/dynamoHelpers'
import { DynamoDataset } from '../types/Dataset'
import { getMetric } from './getMetric'
import timekeeper from 'timekeeper'

const { dynamoTables } = createDynamoConfig(process.env)
const documentClient = createDocumentClient(process.env)
const gateway = new DynamoGateway(documentClient)

const execute = (
  datasetId: string,
  metricId: string,
  start?: string,
  end?: string,
  user = 'testUser'
): Promise<APIGatewayProxyResultV2> =>
  getMetric(
    {
      pathParameters: { datasetId, metricId },
      queryStringParameters: { start, end },
      requestContext: { authorizer: { lambda: { user } } }
    } as unknown as APIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDataset', () => {
  let dataset: DynamoDataset
  beforeAll(async () => {
    dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)
    const startTime = isoToEpoch('2023-01-01T00:00:00Z')
    const id = `${dataset.id}-metricOne`
    for (let i = 0; i < 25; i++) {
      gateway.createMetricValue({ id, t: startTime + i * 240, v: i + 1 })
    }
    await gateway.execute()
  })

  it('should retrieve metrics', async () => {
    const result = (await execute(
      dataset.id,
      'metricOne',
      '2023-01-01T00:00:00Z',
      '2023-01-01T02:00:00Z'
    )) as APIGatewayProxyStructuredResultV2
    const { body, statusCode } = result
    const parsed = JSON.parse(body ?? '')

    expect(statusCode).toEqual(200)
    expect(parsed).toHaveProperty('metrics')
    expect(parsed.metrics).toHaveLength(25)
    expect(parsed.metrics[0]).toStrictEqual({
      time: '2023-01-01T00:00:00.000Z',
      value: 1
    })
    expect(parsed.metrics[24]).toStrictEqual({
      time: '2023-01-01T01:36:00.000Z',
      value: 25
    })
  })

  it('should retrieve metrics with a dataset token', async () => {
    const result = await getMetric(
      {
        pathParameters: { datasetId: dataset.id, metricId: 'metricOne' },
        queryStringParameters: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-01T02:00:00Z'
        },
        requestContext: { authorizer: { lambda: { datasetId: dataset.id } } }
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toHaveProperty('statusCode', 200)
  })

  it('should filter metrics by time', async () => {
    const result = (await execute(
      dataset.id,
      'metricOne',
      '2023-01-01T00:10:00Z',
      '2023-01-01T00:30:00Z'
    )) as APIGatewayProxyStructuredResultV2
    const { body, statusCode } = result
    const parsed = JSON.parse(body ?? '')

    expect(statusCode).toEqual(200)
    expect(parsed).toHaveProperty('metrics')
    expect(parsed.metrics).toHaveLength(5)
    expect(parsed.metrics[0]).toStrictEqual({
      time: '2023-01-01T00:12:00.000Z',
      value: 4
    })
    expect(parsed.metrics[4]).toStrictEqual({
      time: '2023-01-01T00:28:00.000Z',
      value: 8
    })
  })

  it('should default the duration to one hour with only the start set', async () => {
    const result = (await execute(
      dataset.id,
      'metricOne',
      '2023-01-01T00:10:00Z'
    )) as APIGatewayProxyStructuredResultV2
    const { body, statusCode } = result
    const parsed = JSON.parse(body ?? '')

    expect(statusCode).toEqual(200)
    expect(parsed).toHaveProperty('metrics')
    expect(parsed.metrics).toHaveLength(15)
    expect(parsed.metrics[0]).toStrictEqual({
      time: '2023-01-01T00:12:00.000Z',
      value: 4
    })
    expect(parsed.metrics[14]).toStrictEqual({
      time: '2023-01-01T01:08:00.000Z',
      value: 18
    })
  })

  it('should default the duration to one hour with only the end set', async () => {
    const result = (await execute(
      dataset.id,
      'metricOne',
      undefined,
      '2023-01-01T01:10:00Z'
    )) as APIGatewayProxyStructuredResultV2
    const { body, statusCode } = result
    const parsed = JSON.parse(body ?? '')

    expect(statusCode).toEqual(200)
    expect(parsed).toHaveProperty('metrics')
    expect(parsed.metrics).toHaveLength(15)
    expect(parsed.metrics[0]).toStrictEqual({
      time: '2023-01-01T00:12:00.000Z',
      value: 4
    })
    expect(parsed.metrics[14]).toStrictEqual({
      time: '2023-01-01T01:08:00.000Z',
      value: 18
    })
  })

  it('should default to the last hour if start and end are missing', async () => {
    timekeeper.freeze(new Date('2023-01-01T01:10:00Z'))
    const result = (await execute(
      dataset.id,
      'metricOne',
      undefined,
      undefined
    )) as APIGatewayProxyStructuredResultV2
    timekeeper.reset()
    const { body, statusCode } = result
    const parsed = JSON.parse(body ?? '')

    expect(statusCode).toEqual(200)
    expect(parsed).toHaveProperty('metrics')
    expect(parsed.metrics).toHaveLength(15)
    expect(parsed.metrics[0]).toStrictEqual({
      time: '2023-01-01T00:12:00.000Z',
      value: 4
    })
    expect(parsed.metrics[14]).toStrictEqual({
      time: '2023-01-01T01:08:00.000Z',
      value: 18
    })
  })

  it('should return a 404 if the metric does not exist', async () => {
    const result = await execute(
      dataset.id,
      'badMetric',
      '2023-01-01T00:00:00Z',
      '2023-01-01T02:00:00Z'
    )
    expect(result).toStrictEqual({ statusCode: 404 })
  })

  it('should return a 404 if the user does not match', async () => {
    const result = await execute(
      dataset.id,
      'metricOne',
      '2023-01-01T00:00:00Z',
      '2023-01-01T02:00:00Z',
      'wrongUser'
    )

    expect(result).toStrictEqual({ statusCode: 404 })
  })
})
