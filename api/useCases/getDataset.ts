import DynamoGateway from 'api/lib/DynamoGateway'
import { OutputDataset } from 'api/types/Dataset'
import { isError, PromiseResult } from 'api/types/Result'

const getDatasets = async (
  datasetId: string,
  gateway: DynamoGateway,
  authUser?: string
): PromiseResult<OutputDataset> => {
  const dataset = await gateway.getDataset(datasetId)
  if (isError(dataset)) {
    return dataset
  }
  if (authUser && authUser !== dataset.user) {
    return new Error('Dataset not found')
  }

  return {
    id: dataset.id,
    name: dataset.name,
    description: dataset.description,
    createdAt: dataset.createdAt,
    updatedAt: dataset.updatedAt,
    metrics: dataset.metrics
  }
}

export default getDatasets
