import createDynamoConfig from 'api/lib/createDynamoConfig'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import createDocumentClient from '../lib/createDocumentClient'

const documentClient = createDocumentClient(process.env)
const { dynamoTables } = createDynamoConfig(process.env)

export const createItem = async (
  tableName: string,
  item: object
): Promise<void> => {
  await documentClient
    .put({
      TableName: tableName,
      Item: item
    })
    .promise()
}

export const getOne = async (
  tableName: string,
  id: string,
  key = 'id'
): Promise<DocumentClient.AttributeMap | null> => {
  return documentClient
    .get({
      TableName: tableName,
      Key: { [key]: id }
    })
    .promise()
    .then((result) => result.Item ?? null)
}

export const getAll = (tableName: string): Promise<DocumentClient.ItemList> => {
  return documentClient
    .scan({
      TableName: tableName
    })
    .promise()
    .then((result) => result.Items ?? [])
}

export const getAllMetrics = (id: string): Promise<DocumentClient.ItemList> =>
  getRange(dynamoTables.metricsTable, id, 't', 0, 99999999999)

export const getRange = (
  tableName: string,
  id: string,
  rangeKey: string,
  start: number | string,
  end: number | string
): Promise<DocumentClient.ItemList> => {
  return documentClient
    .query({
      TableName: tableName,
      KeyConditionExpression: '#id = :id AND #rangeKey BETWEEN :start AND :end',
      ExpressionAttributeNames: { '#id': 'id', '#rangeKey': rangeKey },
      ExpressionAttributeValues: { ':id': id, ':start': start, ':end': end }
    })
    .promise()
    .then((result) => result.Items ?? [])
}

export const clearDynamoTable = async (
  tableName: string,
  keyName = 'id',
  attempts = 5
) => {
  const items = await getAll(tableName)

  const promises =
    items?.map((item) =>
      documentClient
        .delete({
          TableName: tableName,
          Key: {
            [keyName]: item[keyName]
          }
        })
        .promise()
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
