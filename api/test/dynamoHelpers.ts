import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb'
import createDynamoConfig from 'api/lib/createDynamoConfig'
import createDocumentClient from '../lib/createDocumentClient'

const documentClient = createDocumentClient(process.env)
const { dynamoTables } = createDynamoConfig(process.env)

type DynamoItem = Record<string, any>

export const createItem = async (
  tableName: string,
  item: object
): Promise<void> => {
  await documentClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item
    })
  )
}

export const getOne = async (
  tableName: string,
  id: string,
  key = 'id'
): Promise<DynamoItem | null> => {
  return documentClient
    .send(
      new GetCommand({
        TableName: tableName,
        Key: { [key]: id }
      })
    )
    .then((result) => result.Item ?? null)
}

export const getAll = (tableName: string): Promise<DynamoItem[]> => {
  return documentClient
    .send(
      new ScanCommand({
        TableName: tableName
      })
    )
    .then((result) => result.Items ?? [])
}

export const getAllMetrics = (id: string): Promise<DynamoItem[]> =>
  getRange(dynamoTables.metricsTable, id, 't', 0, 99999999999)

export const getRange = (
  tableName: string,
  id: string,
  rangeKey: string,
  start: number | string,
  end: number | string
): Promise<DynamoItem[]> => {
  return documentClient
    .send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression:
          '#id = :id AND #rangeKey BETWEEN :start AND :end',
        ExpressionAttributeNames: { '#id': 'id', '#rangeKey': rangeKey },
        ExpressionAttributeValues: { ':id': id, ':start': start, ':end': end }
      })
    )
    .then((result) => result.Items ?? [])
}

export const clearDynamoTable = async (
  tableName: string,
  keyName = 'id',
  attempts = 5
): Promise<void> => {
  const items = await getAll(tableName)

  const promises =
    items?.map((item) =>
      documentClient.send(
        new DeleteCommand({
          TableName: tableName,
          Key: {
            [keyName]: item[keyName]
          }
        })
      )
    ) ?? []

  await Promise.all(promises)

  const remainingItems = await getAll(tableName)
  if (remainingItems.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    if (attempts > 0) {
      await clearDynamoTable(tableName, keyName, attempts - 1)
    } else {
      throw new Error('Could not delete items from Dynamo table')
    }
  }
}
