import { getDatasetId, getUser } from 'api/lib/getAuth'
import createDocumentClient from '../lib/createDocumentClient'
import DynamoGateway from '../lib/DynamoGateway'
import { send204, send401, send404, send500 } from '../lib/httpResponses'
import logger from '../lib/logger'
import ApiHandler from '../types/ApiHandler'
import { isError } from '../types/Result'
import { default as deleteMetricUseCase } from '../useCases/deleteMetric'

const documentClient = createDocumentClient(process.env)
const dynamoGateway = new DynamoGateway(documentClient)

export const deleteMetric: ApiHandler = async (event) => {
  const datasetId = event.pathParameters?.datasetId
  const metricId = event.pathParameters?.metricId
  const authUser = getUser(event)
  const authDatasetId = getDatasetId(event)

  if (!authUser && !authDatasetId) {
    return send401()
  }
  if (!datasetId || !metricId) {
    return send500()
  }

  const result = await deleteMetricUseCase(
    datasetId,
    metricId,
    dynamoGateway,
    authUser
  )
  if (isError(result)) {
    if (
      result.message === 'Dataset not found' ||
      result.message === 'Metric not found'
    ) {
      return send404()
    }
    logger.error(result)
    return send500()
  }

  return send204()
}
