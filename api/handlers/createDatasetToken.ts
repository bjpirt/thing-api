import { getUser } from 'api/lib/getAuth'
import createDocumentClient from '../lib/createDocumentClient'
import DynamoGateway from '../lib/DynamoGateway'
import formatZodErrors from '../lib/formatZodErrors'
import {
  send200,
  send400,
  send401,
  send404,
  send500
} from '../lib/httpResponses'
import logger from '../lib/logger'
import ApiHandler from '../types/ApiHandler'
import { createDatasetTokenSchema } from '../types/DatasetToken'
import { isError } from '../types/Result'
import { default as createDatasetTokenUseCase } from '../useCases/createDatasetToken'

const documentClient = createDocumentClient(process.env)
const dynamoGateway = new DynamoGateway(documentClient)

export const createDatasetToken: ApiHandler = async (event) => {
  const authUser = getUser(event)
  const datasetId = event.pathParameters?.datasetId
  if (!datasetId) {
    return send500()
  }
  if (!authUser) {
    return send401()
  }
  if (!event.body) {
    return send400({ errors: ['Body is missing'] })
  }

  try {
    const inputData = createDatasetTokenSchema.safeParse(JSON.parse(event.body))
    if (!inputData.success) {
      return send400({ errors: formatZodErrors(inputData.error) })
    }

    const createResult = await createDatasetTokenUseCase(
      authUser,
      datasetId,
      inputData.data,
      dynamoGateway
    )
    if (isError(createResult)) {
      if (createResult.message === 'Dataset not found') {
        return send404()
      }
      logger.error(createResult)
      return send500()
    }

    return send200(JSON.stringify({ token: createResult }))
  } catch (e: unknown) {
    return send400({ errors: ['JSON parsing error'] })
  }
}
