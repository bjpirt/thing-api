import generateToken from 'api/lib/generateToken'
import { DynamoDatasetKey } from 'api/types/DatasetKey'
import ShortUniqueId from 'short-unique-id'
import DynamoGateway from '../lib/DynamoGateway'
import { CreateDatasetToken } from '../types/DatasetKey'
import { isError, PromiseResult } from '../types/Result'

const uid = new ShortUniqueId({ length: 10 })

const createDatasetToken = async (
  user: string,
  datasetId: string,
  datasetKey: CreateDatasetToken,
  gateway: DynamoGateway
): PromiseResult<string> => {
  const existingDataset = await gateway.getDataset(datasetId)
  if (isError(existingDataset)) {
    return existingDataset
  }
  if (user !== existingDataset.user) {
    return new Error('Dataset not found')
  }

  const tokenId = uid()

  const dynamoData: DynamoDatasetKey = {
    createdAt: new Date().toISOString(),
    ...datasetKey
  }
  const result = await gateway
    .createDatasetToken(datasetId, tokenId, dynamoData)
    .execute()
  if (isError(result)) {
    return result
  }

  return generateToken({
    scope: 'dataset',
    id: datasetId,
    tokenId: tokenId,
    methods: datasetKey.methods
  })
}

export default createDatasetToken
