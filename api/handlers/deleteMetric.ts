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
  const user = event.requestContext?.authorizer?.user

  if (!user) {
    return send401()
  }
  if (!datasetId || !metricId) {
    return send500()
  }

  const result = await deleteMetricUseCase(
    user,
    datasetId,
    metricId,
    dynamoGateway
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
