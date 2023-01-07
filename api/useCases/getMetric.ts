import DynamoGateway, { GetMetricRangeOptions } from 'api/lib/DynamoGateway'
import { epochToIso } from 'api/lib/time'
import { OutputMetric } from 'api/types/Dataset'
import { isError, PromiseResult } from 'api/types/Result'

type GetMetricOptions = {
  start?: string
  end?: string
}

const getMetric = async (
  datasetId: string,
  metricId: string,
  options: GetMetricOptions,
  gateway: DynamoGateway
): PromiseResult<OutputMetric[]> => {
  const { start, end } = options
  const now = new Date()
  const conf: Partial<GetMetricRangeOptions> = {}
  conf.start = start
  conf.end = end

  if (!start && !end) {
    conf.end = now.toISOString()
    conf.start = new Date(now.getTime() - 3_600_000).toISOString()
  } else if (start && !end) {
    conf.end = new Date(new Date(start).getTime() + 3_600_000).toISOString()
  } else if (!start && end) {
    conf.start = new Date(new Date(end).getTime() - 3_600_000).toISOString()
  }

  const dynamoMetrics = await gateway.getMetricRange(
    datasetId,
    metricId,
    conf as GetMetricRangeOptions
  )
  if (isError(dynamoMetrics)) {
    return dynamoMetrics
  }
  return dynamoMetrics.map((m) => ({ time: epochToIso(m.t), value: m.v }))
}

export default getMetric
