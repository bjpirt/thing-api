import DynamoGateway from 'api/lib/DynamoGateway'
import { OutputDatasetToken } from 'api/types/DatasetToken'
import { isError, PromiseResult } from 'api/types/Result'

const getDatasetTokens = async (
  user: string,
  datasetId: string,
  gateway: DynamoGateway
): PromiseResult<OutputDatasetToken[]> => {
  const dataset = await gateway.getDataset(datasetId)
  if (isError(dataset)) {
    return dataset
  }
  if (user !== dataset.user) {
    return new Error('Dataset not found')
  }

  return Object.entries(dataset.tokens).reduce(
    (acc: OutputDatasetToken[], [id, token]) => {
      acc.push({ id, ...token })
      return acc
    },
    []
  )
}

export default getDatasetTokens
