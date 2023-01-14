import ShortUniqueId from 'short-unique-id'
import DynamoGateway from '../lib/DynamoGateway'
import { DynamoDataset, CreateDataset } from '../types/Dataset'
import { isError, PromiseResult } from '../types/Result'

const uid = new ShortUniqueId({ length: 10 })

const createDataset = async (
  user: string,
  dataset: CreateDataset,
  gateway: DynamoGateway
): PromiseResult<DynamoDataset> => {
  const now = new Date().toISOString()
  const dynamoData: DynamoDataset = {
    id: uid(),
    user,
    createdAt: now,
    updatedAt: now,
    keys: {},
    ...dataset
  }
  const result = await gateway.createDataset(dynamoData).execute()
  if (isError(result)) {
    return result
  }
  return dynamoData
}

export default createDataset
