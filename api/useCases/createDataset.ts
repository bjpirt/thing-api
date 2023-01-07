import ShortUniqueId from 'short-unique-id'
import DynamoGateway from '../lib/DynamoGateway'
import { DynamoDataset, CreateDataset, OutputDataset } from '../types/Dataset'
import { isError, PromiseResult } from '../types/Result'

const uid = new ShortUniqueId({ length: 10 })

const createDataset = async (
  dataset: CreateDataset,
  gateway: DynamoGateway
): PromiseResult<OutputDataset> => {
  const now = new Date().toISOString()
  const dynamoData: DynamoDataset = {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    ...dataset
  }
  const result = await gateway.createDataset(dynamoData).execute()
  if (isError(result)) {
    return result
  }
  return dynamoData as OutputDataset
}

export default createDataset
