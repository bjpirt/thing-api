import { z } from 'zod'
import { DynamoDatasetToken } from './DatasetToken'

const metricIdSchema = z.string().regex(/^[a-zA-Z0-9\-_]+$/, {
  message: 'Metric id must be alphanumeric (a-z, A-Z, 0-9, -, _) with no spaces'
})

export const createMetricSchema = z.object({
  unit: z.string().optional(),
  description: z.string().optional()
})

export const updateMetricSchema = createMetricSchema.extend({
  time: z.string().optional(),
  value: z.number().optional()
})

export const createDatasetSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  metrics: z.record(metricIdSchema, createMetricSchema)
})

export const updateDatasetSchema = createDatasetSchema.extend({
  name: z.string().optional(),
  metrics: z.record(metricIdSchema, updateMetricSchema).optional()
})

export type CreateMetric = z.infer<typeof createMetricSchema>
export type CreateDataset = z.infer<typeof createDatasetSchema>

export type UpdateMetric = z.infer<typeof createMetricSchema>
export type UpdateDataset = z.infer<typeof updateDatasetSchema>

export type OutputMetric = CreateMetric & {
  time?: string
  value?: number
}

export type OutputDataset = CreateDataset & {
  id: string
  createdAt: string
  updatedAt: string
  metrics: {
    [k: string]: OutputMetric
  }
}

export type DynamoDataset = CreateDataset & {
  id: string
  user: string
  createdAt: string
  updatedAt: string
  metrics: {
    [id: string]: OutputMetric
  }
  tokens: {
    [id: string]: DynamoDatasetToken
  }
}

export type DynamoUpdateDataset = UpdateDataset & {
  id: string
  updatedAt: string
}

export type DynamoMetricValue = {
  id: string
  t: number
  v: number
}
