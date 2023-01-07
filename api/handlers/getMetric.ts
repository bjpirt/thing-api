import logger from 'api/lib/logger'
import { isError } from 'api/types/Result'
import createDocumentClient from '../lib/createDocumentClient'
import DynamoGateway from '../lib/DynamoGateway'
import { send200, send500 } from '../lib/httpResponses'
import ApiHandler from '../types/ApiHandler'

import { default as getMetricUseCase } from '../useCases/getMetric'

const documentClient = createDocumentClient(process.env)
const dynamoGateway = new DynamoGateway(documentClient)

export const getMetric: ApiHandler = async (event) => {
  const datasetId = event.pathParameters?.datasetId
  const metricId = event.pathParameters?.metricId
  if (!datasetId || !metricId) {
    return send500()
  }
  const start = event.queryStringParameters?.start
  const end = event.queryStringParameters?.end

  const metrics = await getMetricUseCase(
    datasetId,
    metricId,
    { start, end },
    dynamoGateway
  )
  if (isError(metrics)) {
    logger.error(metrics)
    return send500()
  }

  return send200(JSON.stringify({ metrics }))
}
