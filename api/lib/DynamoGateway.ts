import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  QueryCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput
} from '@aws-sdk/lib-dynamodb'
import { DynamoDatasetToken } from 'api/types/DatasetToken'
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
  private actions: TransactWriteCommandInput = { TransactItems: [] }

  constructor(private documentClient: DynamoDBDocumentClient) {}

  async getDatasets(user: string): PromiseResult<DynamoDataset[]> {
    const queryCommand = new QueryCommand({
      TableName: dynamoTables.datasetsTable,
      IndexName: 'userDatasetIndex',
      KeyConditionExpression: '#user = :user',
      ExpressionAttributeValues: {
        ':user': user
      },
      ExpressionAttributeNames: {
        '#user': 'user'
      }
    })

    return this.documentClient
      .send(queryCommand)
      .then((result) => (result.Items ? result.Items : []))
      .catch((e) => e)
  }

  async getDataset(id: string): PromiseResult<DynamoDataset> {
    const getCommand = new GetCommand({
      TableName: dynamoTables.datasetsTable,
      Key: { id }
    })

    const sendRes = this.documentClient.send(getCommand)

    return sendRes
      .then((result) =>
        result.Item ? result.Item : new Error('Dataset not found')
      )
      .catch((e) => e)
  }

  async deleteDataset(id: string): PromiseResult<void> {
    const deleteCommand = new DeleteCommand({
      TableName: dynamoTables.datasetsTable,
      Key: { id }
    })

    return this.documentClient.send(deleteCommand).catch((e) => e)
  }

  createDataset(dataset: DynamoDataset): DynamoGateway {
    this.actions.TransactItems?.push({
      Put: { TableName: dynamoTables.datasetsTable, Item: dataset }
    })
    return this
  }

  deleteMetric(datasetId: string, metricId: string): DynamoGateway {
    return this.deleteDatasetSubKey(datasetId, 'metrics', metricId)
  }

  deleteDatasetToken(datasetId: string, tokenId: string): DynamoGateway {
    return this.deleteDatasetSubKey(datasetId, 'tokens', tokenId)
  }

  deleteDatasetSubKey(datasetId: string, parentKey: string, childKey: string) {
    this.actions.TransactItems?.push({
      Update: {
        TableName: dynamoTables.datasetsTable,
        Key: { id: datasetId },
        UpdateExpression: `REMOVE #parentKey.#childKey`,
        ExpressionAttributeNames: {
          '#parentKey': parentKey,
          '#childKey': childKey
        }
      }
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

    this.actions.TransactItems?.push({
      Update: {
        TableName: dynamoTables.datasetsTable,
        Key: { id: dataset.id },
        UpdateExpression: `SET ${updateExpression.join(',')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames
      }
    })
    return this
  }

  createMetricValue(metricValue: DynamoMetricValue) {
    this.actions.TransactItems?.push({
      Put: { TableName: dynamoTables.metricsTable, Item: metricValue }
    })
    return this
  }

  async execute(): PromiseResult<void> {
    const transactCommand = new TransactWriteCommand(this.actions)
    const result = await this.documentClient
      .send(transactCommand)
      .catch((e) => e)
    this.actions.TransactItems = []
    return result
  }

  getMetricRange(
    datasetId: string,
    metricId: string,
    options: GetMetricRangeOptions
  ): PromiseResult<DynamoMetricValue[]> {
    const id = `${datasetId}-${metricId}`
    const params: QueryCommandInput = {
      TableName: dynamoTables.metricsTable,
      KeyConditionExpression: '#id = :id AND #rangeKey BETWEEN :start AND :end',
      ExpressionAttributeNames: { '#id': 'id', '#rangeKey': 't' },
      ExpressionAttributeValues: {
        ':id': id,
        ':start': isoToEpoch(options.start),
        ':end': isoToEpoch(options.end)
      }
    }
    const queryCommand = new QueryCommand(params)
    return this.documentClient
      .send(queryCommand)
      .then((result) => (result.Items as unknown as DynamoMetricValue[]) ?? [])
      .catch((e) => e)
  }

  createDatasetToken(
    datasetId: string,
    tokenId: string,
    datasetToken: DynamoDatasetToken
  ): DynamoGateway {
    this.actions.TransactItems?.push({
      Update: {
        TableName: dynamoTables.datasetsTable,
        Key: { id: datasetId },
        UpdateExpression: `SET #tokens.#tokenId = :datasetToken`,
        ExpressionAttributeValues: { ':datasetToken': datasetToken },
        ExpressionAttributeNames: { '#tokens': 'tokens', '#tokenId': tokenId }
      }
    })
    return this
  }
}

export default DynamoGateway
