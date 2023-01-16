import { getDatasetId, getUser } from 'api/lib/getAuth'
import createDocumentClient from '../lib/createDocumentClient'
import DynamoGateway from '../lib/DynamoGateway'
import { send200, send401, send404, send500 } from '../lib/httpResponses'
import logger from '../lib/logger'
import ApiHandler from '../types/ApiHandler'
import { isError } from '../types/Result'
import { default as getDatasetUseCase } from '../useCases/getDataset'

const documentClient = createDocumentClient(process.env)
const dynamoGateway = new DynamoGateway(documentClient)

export const getDataset: ApiHandler = async (event) => {
  const datasetId = event.pathParameters?.datasetId
  const authUser = getUser(event)
  const authDatasetId = getDatasetId(event)

  if (!authUser && !authDatasetId) {
    return send401()
  }
  if (!datasetId) {
    return send500()
  }

  const dataset = await getDatasetUseCase(datasetId, dynamoGateway, authUser)
  if (isError(dataset)) {
    if (dataset.message === 'Dataset not found') {
      return send404()
    }
    logger.error(dataset)
    return send500()
  }

  return send200(JSON.stringify(dataset))
}
