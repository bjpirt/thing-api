import createDynamoConfig from './createDynamoConfig'
const defaultEnv = {
  METRICS_TABLE: 'metricsTable',
  DATASETS_TABLE: 'datasetsTable'
}

describe('createDynamoConfig', () => {
  it('should correctly create the config', () => {
    const result = createDynamoConfig(defaultEnv)
    expect(result).toStrictEqual({
      dynamoConfig: {},
      dynamoTables: {
        datasetsTable: 'datasetsTable',
        metricsTable: 'metricsTable'
      }
    })
  })

  it('should throw an exception without the METRICS_TABLE environment variable', () => {
    expect(() =>
      createDynamoConfig({ DATASETS_TABLE: 'datasetsTable' })
    ).toThrow()
  })

  it('should throw an exception without the DATASETS_TABLE environment variable', () => {
    expect(() => createDynamoConfig({ metricsTable: 'metricsTable' })).toThrow()
  })

  it('should create dev config when running offline', () => {
    const result = createDynamoConfig({ ...defaultEnv, IS_OFFLINE: 'true' })
    expect(result).toStrictEqual({
      dynamoConfig: {
        endpoint: 'http://localhost:8000',
        region: 'localhost',
        credentials: {
          accessKeyId: 'AWS_ACCESS_KEY_ID',
          secretAccessKey: 'AWS_SECRET_ACCESS_KEY'
        }
      },
      dynamoTables: {
        datasetsTable: 'datasetsTable',
        metricsTable: 'metricsTable'
      }
    })
  })

  it('should create dev config when running in jest', () => {
    const result = createDynamoConfig({ ...defaultEnv, JEST_WORKER_ID: '1' })
    expect(result).toStrictEqual({
      dynamoConfig: {
        endpoint: 'http://localhost:8000',
        region: 'localhost',
        credentials: {
          accessKeyId: 'AWS_ACCESS_KEY_ID',
          secretAccessKey: 'AWS_SECRET_ACCESS_KEY'
        }
      },
      dynamoTables: {
        datasetsTable: 'thing-api-dev-datasets',
        metricsTable: 'thing-api-dev-metrics'
      }
    })
  })
})
