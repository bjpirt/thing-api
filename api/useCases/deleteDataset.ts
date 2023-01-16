import DynamoGateway from 'api/lib/DynamoGateway'
import { isError, PromiseResult } from 'api/types/Result'

const deleteDataset = async (
  datasetId: string,
  gateway: DynamoGateway,
  authUser?: string
): PromiseResult<void> => {
  const dataset = await gateway.getDataset(datasetId)
  if (isError(dataset)) {
    return dataset
  }
  if (authUser && authUser !== dataset.user) {
    return new Error('Dataset not found')
  }
  return await gateway.deleteDataset(datasetId)
}

export default deleteDataset
