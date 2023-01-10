import DynamoGateway from 'api/lib/DynamoGateway'
import { OutputDataset } from 'api/types/Dataset'
import { isError, PromiseResult } from 'api/types/Result'

const getDatasets = async (
  user: string,
  gateway: DynamoGateway
): PromiseResult<OutputDataset[]> => {
  const datasets = await gateway.getDatasets(user)
  if (isError(datasets)) {
    return datasets
  }
  return datasets.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    metrics: d.metrics
  }))
}

export default getDatasets
