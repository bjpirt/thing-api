import DynamoGateway from 'api/lib/DynamoGateway'
import { isError, PromiseResult } from 'api/types/Result'

const deleteDataset = async (
  user: string,
  datasetId: string,
  gateway: DynamoGateway
): PromiseResult<void> => {
  const dataset = await gateway.getDataset(datasetId)
  if (isError(dataset)) {
    return dataset
  }
  if (user !== dataset.user) {
    return new Error('Dataset not found')
  }
  return await gateway.deleteDataset(datasetId)
}

export default deleteDataset
