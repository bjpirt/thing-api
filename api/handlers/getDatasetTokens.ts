import createDocumentClient from '../lib/createDocumentClient'
import DynamoGateway from '../lib/DynamoGateway'
import { send200, send401, send404, send500 } from '../lib/httpResponses'
import logger from '../lib/logger'
import ApiHandler from '../types/ApiHandler'
import { isError } from '../types/Result'
import { default as getDatasetTokensUseCase } from '../useCases/getDatasetTokens'

const documentClient = createDocumentClient(process.env)
const dynamoGateway = new DynamoGateway(documentClient)

export const getDatasetTokens: ApiHandler = async (event) => {
  const datasetId = event.pathParameters?.datasetId
  const user = event.requestContext?.authorizer?.user

  if (!user) {
    return send401()
  }
  if (!datasetId) {
    return send500()
  }

  const tokens = await getDatasetTokensUseCase(user, datasetId, dynamoGateway)
  if (isError(tokens)) {
    if (tokens.message === 'Dataset not found') {
      return send404()
    }
    logger.error(tokens)
    return send500()
  }

  return send200(JSON.stringify({ tokens }))
}
