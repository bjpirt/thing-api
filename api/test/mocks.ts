import { CreateDataset, DynamoDataset } from 'api/types/Dataset'
import ShortUniqueId from 'short-unique-id'

const uid = new ShortUniqueId({ length: 10 })

export const mockCreateDataset = (
  dataset: Partial<CreateDataset> = {}
): CreateDataset => ({
  name: 'Test',
  description: 'Test Data Set',
  metrics: {
    metricOne: {
      description: 'Test Metric',
      unit: 'W'
    }
  },
  ...dataset
})
export const mockDynamoDataset = (
  dataset: Partial<DynamoDataset> = {}
): DynamoDataset => ({
  ...mockCreateDataset(),
  id: uid(),
  user: 'testUser',
  tokens: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...dataset
})
