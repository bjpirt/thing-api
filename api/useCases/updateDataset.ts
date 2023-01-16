import { isoToEpoch } from 'api/lib/time'
import DynamoGateway from '../lib/DynamoGateway'
import { DynamoUpdateDataset, UpdateDataset } from '../types/Dataset'
import { isError, PromiseResult } from '../types/Result'

const updateDataset = async (
  datasetId: string,
  dataset: UpdateDataset,
  gateway: DynamoGateway,
  authUser?: string
): PromiseResult<void> => {
  const existingDataset = await gateway.getDataset(datasetId)
  if (isError(existingDataset)) {
    return existingDataset
  }
  if (authUser && authUser !== existingDataset.user) {
    return new Error('Dataset not found')
  }

  const dynamoUpdateDataset: DynamoUpdateDataset = {
    id: datasetId,
    updatedAt: new Date().toISOString(),
    ...dataset
  }

  if (dataset.metrics) {
    Object.entries(dataset.metrics).forEach(([metricId, metric]) => {
      if (metric.value) {
        if (!metric.time) {
          metric.time = new Date().toISOString()
        }
        const t = isoToEpoch(metric.time)
        const id = `${datasetId}-${metricId}`
        gateway.createMetricValue({ id, t, v: metric.value })
      }
    })
  }

  gateway.updateDataset(dynamoUpdateDataset, existingDataset)

  const result = await gateway.execute()
  if (isError(result)) {
    return result
  }
}

export default updateDataset
