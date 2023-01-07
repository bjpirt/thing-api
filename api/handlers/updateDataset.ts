import createDocumentClient from '../lib/createDocumentClient'
import DynamoGateway from '../lib/DynamoGateway'
import formatZodErrors from '../lib/formatZodErrors'
import { send204, send400, send404, send500 } from '../lib/httpResponses'
import logger from '../lib/logger'
import ApiHandler from '../types/ApiHandler'
import { updateDatasetSchema } from '../types/Dataset'
import { isError } from '../types/Result'
import { default as updateDatasetUseCase } from '../useCases/updateDataset'

const documentClient = createDocumentClient(process.env)
const dynamoGateway = new DynamoGateway(documentClient)

export const updateDataset: ApiHandler = async (event) => {
  if (!event.pathParameters?.datasetId) {
    return send500()
  }
  if (!event.body) {
    return send400({ errors: ['Body is missing'] })
  }

  try {
    const inputData = updateDatasetSchema.safeParse(JSON.parse(event.body))
    if (!inputData.success) {
      return send400({
        errors: formatZodErrors(inputData.error)
      })
    }

    const createResult = await updateDatasetUseCase(
      event.pathParameters.datasetId,
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

    return send204()
  } catch (e: unknown) {
    return send400({ errors: ['JSON parsing error'] })
  }
}
