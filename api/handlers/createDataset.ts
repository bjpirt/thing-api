import createDocumentClient from '../lib/createDocumentClient'
import DynamoGateway from '../lib/DynamoGateway'
import formatZodErrors from '../lib/formatZodErrors'
import { send201, send400, send500 } from '../lib/httpResponses'
import logger from '../lib/logger'
import ApiHandler from '../types/ApiHandler'
import { createDatasetSchema } from '../types/Dataset'
import { isError } from '../types/Result'
import { default as createDatasetUseCase } from '../useCases/createDataset'

const documentClient = createDocumentClient(process.env)
const dynamoGateway = new DynamoGateway(documentClient)

export const createDataset: ApiHandler = async (event) => {
  if (!event.body) {
    return send400({ errors: ['Body is missing'] })
  }

  try {
    const inputData = createDatasetSchema.safeParse(JSON.parse(event.body))
    if (!inputData.success) {
      return send400({
        errors: formatZodErrors(inputData.error)
      })
    }

    const createResult = await createDatasetUseCase(
      inputData.data,
      dynamoGateway
    )
    if (isError(createResult)) {
      logger.error(createResult)
      return send500()
    }

    return send201({ Location: `/datasets/${createResult.id}` })
  } catch (e: unknown) {
    return send400({ errors: ['JSON parsing error'] })
  }
}
