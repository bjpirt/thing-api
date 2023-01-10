import createDocumentClient from '../lib/createDocumentClient'
import DynamoGateway from '../lib/DynamoGateway'
import { send200, send401, send500 } from '../lib/httpResponses'
import logger from '../lib/logger'
import ApiHandler from '../types/ApiHandler'
import { isError } from '../types/Result'
import { default as getDatasetsUseCase } from '../useCases/getDatasets'

const documentClient = createDocumentClient(process.env)
const dynamoGateway = new DynamoGateway(documentClient)

export const getDatasets: ApiHandler = async (event) => {
  const user = event.requestContext?.authorizer?.user
  if (!user) {
    return send401()
  }

  const datasets = await getDatasetsUseCase(user, dynamoGateway)
  if (isError(datasets)) {
    logger.error(datasets)
    return send500()
  }

  return send200(JSON.stringify({ datasets }))
}
