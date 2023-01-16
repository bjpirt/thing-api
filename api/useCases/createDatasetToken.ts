import generateToken from 'api/lib/generateToken'
import { DynamoDatasetToken } from 'api/types/DatasetToken'
import ShortUniqueId from 'short-unique-id'
import DynamoGateway from '../lib/DynamoGateway'
import { CreateDatasetToken } from '../types/DatasetToken'
import { isError, PromiseResult } from '../types/Result'

const uid = new ShortUniqueId({ length: 10 })

const createDatasetToken = async (
  user: string,
  datasetId: string,
  datasetToken: CreateDatasetToken,
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

  const dynamoData: DynamoDatasetToken = {
    createdAt: new Date().toISOString(),
    ...datasetToken
  }
  const result = await gateway
    .createDatasetToken(datasetId, tokenId, dynamoData)
    .execute()
  if (isError(result)) {
    return result
  }

  return generateToken({
    scope: 'dataset',
    datasetId,
    tokenId: tokenId,
    methods: datasetToken.methods
  })
}

export default createDatasetToken
