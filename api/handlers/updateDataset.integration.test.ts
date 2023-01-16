jest.setTimeout(9999999)
import { isoToEpoch } from 'api/lib/time'
import { mockDynamoDataset } from 'api/test/mocks'
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context
} from 'aws-lambda'
import createDynamoConfig from '../lib/createDynamoConfig'
import { createItem, getAllMetrics, getOne } from '../test/dynamoHelpers'
import { DynamoDataset, UpdateDataset } from '../types/Dataset'
import { updateDataset } from './updateDataset'

const { dynamoTables } = createDynamoConfig(process.env)

const execute = (
  id: string,
  dataset: UpdateDataset
): void | Promise<APIGatewayProxyResultV2> =>
  updateDataset(
    {
      body: JSON.stringify(dataset),
      pathParameters: { datasetId: id },
      requestContext: { authorizer: { user: 'testUser' } }
    } as unknown as APIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDataset', () => {
  let dataset: DynamoDataset

  beforeEach(async () => {
    dataset = mockDynamoDataset()
    await createItem(dynamoTables.datasetsTable, dataset)
  })

  it('should return a 404 if it does not exist', async () => {
    const result = await execute('badId', {})
    expect(result).toStrictEqual({
      statusCode: 404
    })
  })

  it('should update the base attributes', async () => {
    const datasetUpdate: UpdateDataset = {
      name: 'Updated Name',
      description: 'Updated Description'
    }

    const result = await execute(dataset.id, datasetUpdate)

    expect(result).toStrictEqual({
      statusCode: 204
    })

    const record = await getOne(dynamoTables.datasetsTable, dataset.id)
    expect(record!.name).toEqual(datasetUpdate.name)
    expect(record!.description).toEqual(datasetUpdate.description)
    expect(record!.updatedAt).not.toEqual(dataset.updatedAt)
  })

  it('should update a dataset with a dataset token', async () => {
    const datasetUpdate: UpdateDataset = {
      name: 'Updated Name'
    }

    const result = await updateDataset(
      {
        body: JSON.stringify(datasetUpdate),
        pathParameters: { datasetId: dataset.id },
        requestContext: { authorizer: { datasetId: dataset.id } }
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toHaveProperty('statusCode', 204)
  })

  it('should update the metric attributes for an existing metric and add historic values', async () => {
    const unit = 'Updated Unit'
    const description = 'Updated Desc'
    const time = new Date().toISOString()
    const value = 123
    const datasetUpdate: UpdateDataset = {
      metrics: { metricOne: { unit, description, time, value } }
    }

    const result = await execute(dataset.id, datasetUpdate)

    expect(result).toStrictEqual({ statusCode: 204 })

    const record = await getOne(dynamoTables.datasetsTable, dataset.id)
    const metric = record!.metrics?.metricOne
    expect(metric).toBeDefined()
    expect(metric.unit).toEqual(unit)
    expect(metric.description).toEqual(description)
    expect(metric.time).toEqual(time)
    expect(metric.value).toEqual(value)

    const metricId = `${dataset.id}-metricOne`
    const metrics = await getAllMetrics(metricId)
    expect(metrics).toHaveLength(1)
    expect(metrics[0]).toStrictEqual({
      id: metricId,
      t: isoToEpoch(time),
      v: value
    })
  })

  it('should add the current time for a new metric value', async () => {
    const value = 123
    const datasetUpdate: UpdateDataset = {
      metrics: { metricOne: { value } }
    }

    const result = await execute(dataset.id, datasetUpdate)

    expect(result).toStrictEqual({ statusCode: 204 })

    const record = await getOne(dynamoTables.datasetsTable, dataset.id)
    const metric = record!.metrics?.metricOne
    expect(metric).toBeDefined()
    expect(metric.value).toEqual(value)
    expect(metric.time).toBeDefined()

    const metricId = `${dataset.id}-metricOne`
    const metrics = await getAllMetrics(metricId)
    expect(metrics).toHaveLength(1)
    expect(metrics[0]).toHaveProperty('t')
  })

  it('should add a new metric if it does not exist and add historic values', async () => {
    const unit = 'New Unit'
    const description = 'New Desc'
    const time = new Date().toISOString()
    const value = 123
    const datasetUpdate: UpdateDataset = {
      metrics: { metricTwo: { unit, description, time, value } }
    }

    const result = await execute(dataset.id, datasetUpdate)

    expect(result).toStrictEqual({ statusCode: 204 })

    const record = await getOne(dynamoTables.datasetsTable, dataset.id)
    const metric = record!.metrics?.metricTwo
    expect(metric).toBeDefined()
    expect(metric.unit).toEqual(unit)
    expect(metric.description).toEqual(description)
    expect(metric.time).toEqual(time)
    expect(metric.value).toEqual(value)

    const metricId = `${dataset.id}-metricTwo`
    const metrics = await getAllMetrics(metricId)
    expect(metrics).toHaveLength(1)
    expect(metrics[0]).toStrictEqual({
      id: metricId,
      t: isoToEpoch(time),
      v: value
    })
  })

  it('should add a new metric if it does not exist and update existing metrics and add historic values', async () => {
    const updatedUnit = 'Updated Unit'
    const updatedDescription = 'Updated Desc'
    const updatedTime = new Date().toISOString()
    const updatedValue = 1234
    const newUnit = 'New Unit'
    const newDescription = 'New Desc'
    const newTime = new Date().toISOString()
    const newValue = 4321
    const datasetUpdate: UpdateDataset = {
      metrics: {
        metricOne: {
          unit: updatedUnit,
          description: updatedDescription,
          time: updatedTime,
          value: updatedValue
        },
        metricTwo: {
          unit: newUnit,
          description: newDescription,
          time: newTime,
          value: newValue
        }
      }
    }

    const result = await execute(dataset.id, datasetUpdate)

    expect(result).toStrictEqual({ statusCode: 204 })

    const record = await getOne(dynamoTables.datasetsTable, dataset.id)
    const metricOne = record!.metrics?.metricOne
    expect(metricOne).toBeDefined()
    expect(metricOne.unit).toEqual(updatedUnit)
    expect(metricOne.description).toEqual(updatedDescription)
    expect(metricOne.time).toEqual(updatedTime)
    expect(metricOne.value).toEqual(updatedValue)
    const metricTwo = record!.metrics?.metricTwo
    expect(metricTwo).toBeDefined()
    expect(metricTwo).toBeDefined()
    expect(metricTwo.unit).toEqual(newUnit)
    expect(metricTwo.description).toEqual(newDescription)
    expect(metricTwo.time).toEqual(newTime)
    expect(metricTwo.value).toEqual(newValue)

    const metricId = `${dataset.id}-metricOne`
    const metrics = await getAllMetrics(metricId)
    expect(metrics).toHaveLength(1)
    expect(metrics[0]).toStrictEqual({
      id: metricId,
      t: isoToEpoch(updatedTime),
      v: updatedValue
    })

    const newMetricId = `${dataset.id}-metricTwo`
    const newMetrics = await getAllMetrics(newMetricId)
    expect(newMetrics).toHaveLength(1)
    expect(newMetrics[0]).toStrictEqual({
      id: newMetricId,
      t: isoToEpoch(newTime),
      v: newValue
    })
  })

  it('should return a 404 if the user does not match', async () => {
    const datasetUpdate: UpdateDataset = {
      name: 'Updated Name',
      description: 'Updated Description'
    }

    const result = await updateDataset(
      {
        body: JSON.stringify(datasetUpdate),
        pathParameters: { datasetId: dataset.id },
        requestContext: { authorizer: { user: 'wrongUser' } }
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 404
    })
  })
})
