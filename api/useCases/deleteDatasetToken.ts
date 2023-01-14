import DynamoGateway from 'api/lib/DynamoGateway'
import { isError, PromiseResult } from 'api/types/Result'

const deleteDatasetToken = async (
  user: string,
  datasetId: string,
  tokenId: string,
  gateway: DynamoGateway
): PromiseResult<void> => {
  const dataset = await gateway.getDataset(datasetId)
  if (isError(dataset)) {
    return dataset
  }
  if (user !== dataset.user) {
    return new Error('Dataset not found')
  }
  if (!dataset.tokens[tokenId]) {
    return new Error('Token not found')
  }

  return await gateway.deleteDatasetToken(datasetId, tokenId).execute()
}

export default deleteDatasetToken
