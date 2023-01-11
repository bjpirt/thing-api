import DynamoGateway from 'api/lib/DynamoGateway'
import { isError, PromiseResult } from 'api/types/Result'

const deleteMetric = async (
  user: string,
  datasetId: string,
  metricId: string,
  gateway: DynamoGateway
): PromiseResult<void> => {
  const dataset = await gateway.getDataset(datasetId)
  if (isError(dataset)) {
    return dataset
  }
  if (user !== dataset.user) {
    return new Error('Dataset not found')
  }
  if (!dataset.metrics[metricId]) {
    return new Error('Metric not found')
  }

  return await gateway.deleteMetric(datasetId, metricId).execute()
}

export default deleteMetric
