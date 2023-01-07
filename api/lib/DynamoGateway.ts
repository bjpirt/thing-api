import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import {
  DynamoDataset,
  DynamoMetricValue,
  DynamoUpdateDataset
} from '../types/Dataset'
import { PromiseResult } from '../types/Result'
import createDynamoConfig from './createDynamoConfig'
import { isoToEpoch } from './time'

const { dynamoTables } = createDynamoConfig(process.env)

export type GetMetricRangeOptions = {
  start: string
  end: string
}

class DynamoGateway {
  private actions: DocumentClient.TransactWriteItem[] = []

  constructor(private documentClient: DocumentClient) {}

  async getDataset(id: string): PromiseResult<DynamoDataset> {
    return this.documentClient
      .get({ TableName: dynamoTables.datasetsTable, Key: { id } })
      .promise()
      .then((result) =>
        result.Item ? result.Item : new Error('Dataset not found')
      )
      .catch((e) => e)
  }

  createDataset(dataset: DynamoDataset): DynamoGateway {
    this.actions.push({
      Put: { TableName: dynamoTables.datasetsTable, Item: dataset }
    })
    return this
  }

  updateDataset(
    dataset: DynamoUpdateDataset,
    existingDataset: DynamoDataset
  ): DynamoGateway {
    const updateExpression: string[] = []
    const expressionAttributeNames: { [k: string]: string } = {}
    const expressionAttributeValues: { [k: string]: string | object } = {}

    ;['name', 'description', 'updatedAt'].forEach((attr) => {
      if (attr in dataset) {
        updateExpression.push(`#${attr} = :${attr}`)
        expressionAttributeNames[`#${attr}`] = attr
        expressionAttributeValues[`:${attr}`] = (dataset as any)[attr]
      }
    })

    const metrics = dataset.metrics
    if (metrics !== undefined) {
      Object.entries(metrics).forEach(([metricId, metric]) => {
        if (existingDataset.metrics[metricId]) {
          ;['unit', 'description', 'time', 'value'].forEach((attr) => {
            if (attr in metric) {
              const elementId = `${metricId}${attr}`
              updateExpression.push(
                `#metrics.#${metricId}.#${attr} = :${elementId}`
              )
              expressionAttributeNames['#metrics'] = 'metrics'
              expressionAttributeNames[`#${metricId}`] = metricId
              expressionAttributeNames[`#${attr}`] = attr
              expressionAttributeValues[`:${elementId}`] = (metric as any)[attr]
            }
          })
        } else {
          updateExpression.push(`#metrics.#${metricId} = :${metricId}`)
          expressionAttributeNames['#metrics'] = 'metrics'
          expressionAttributeNames[`#${metricId}`] = metricId
          expressionAttributeValues[`:${metricId}`] = metric
        }
      })
    }

    const action: DocumentClient.TransactWriteItem = {
      Update: {
        TableName: dynamoTables.datasetsTable,
        Key: { id: dataset.id },
        UpdateExpression: `SET ${updateExpression.join(',')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames
      }
    }
    this.actions.push(action)
    return this
  }

  createMetricValue(metricValue: DynamoMetricValue) {
    this.actions.push({
      Put: { TableName: dynamoTables.metricsTable, Item: metricValue }
    })
    return this
  }

  async execute(): PromiseResult<void> {
    return this.documentClient
      .transactWrite({ TransactItems: this.actions })
      .promise()
      .catch((e) => e)
  }

  getMetricRange(
    datasetId: string,
    metricId: string,
    options: GetMetricRangeOptions
  ): PromiseResult<DynamoMetricValue[]> {
    const id = `${datasetId}-${metricId}`
    const params: DocumentClient.QueryInput = {
      TableName: dynamoTables.metricsTable,
      KeyConditionExpression: '#id = :id AND #rangeKey BETWEEN :start AND :end',
      ExpressionAttributeNames: { '#id': 'id', '#rangeKey': 't' },
      ExpressionAttributeValues: {
        ':id': id,
        ':start': isoToEpoch(options.start),
        ':end': isoToEpoch(options.end)
      }
    }
    return this.documentClient
      .query(params)
      .promise()
      .then((result) => (result.Items as DynamoMetricValue[]) ?? [])
      .catch((e) => e)
  }
}

export default DynamoGateway
