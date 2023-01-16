import { getUser } from 'api/lib/getAuth'
import createDocumentClient from '../lib/createDocumentClient'
import DynamoGateway from '../lib/DynamoGateway'
import { send204, send401, send404, send500 } from '../lib/httpResponses'
import logger from '../lib/logger'
import ApiHandler from '../types/ApiHandler'
import { isError } from '../types/Result'
import { default as deleteDatasetTokenUseCase } from '../useCases/deleteDatasetToken'

const documentClient = createDocumentClient(process.env)
const dynamoGateway = new DynamoGateway(documentClient)

export const deleteDatasetToken: ApiHandler = async (event) => {
  const datasetId = event.pathParameters?.datasetId
  const tokenId = event.pathParameters?.tokenId
  const authUser = getUser(event)

  if (!authUser) {
    return send401()
  }
  if (!datasetId || !tokenId) {
    return send500()
  }

  const deleteResult = await deleteDatasetTokenUseCase(
    authUser,
    datasetId,
    tokenId,
    dynamoGateway
  )
  if (isError(deleteResult)) {
    if (
      deleteResult.message === 'Dataset not found' ||
      deleteResult.message === 'Token not found'
    ) {
      return send404()
    }
    logger.error(deleteResult)
    return send500()
  }

  return send204()
}
