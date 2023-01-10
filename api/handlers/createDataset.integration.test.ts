import { mockCreateDataset } from 'api/test/mocks'
import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'
import { APIGatewayProxyResultV2, Callback, Context } from 'aws-lambda'
import createDynamoConfig from '../lib/createDynamoConfig'
import { clearDynamoTable, getAll } from '../test/dynamoHelpers'
import { CreateDataset } from '../types/Dataset'
import { createDataset } from './createDataset'

const { dynamoTables } = createDynamoConfig(process.env)

const execute = (
  dataset: CreateDataset
): void | Promise<APIGatewayProxyResultV2> =>
  createDataset(
    {
      body: JSON.stringify(dataset),
      requestContext: { authorizer: { user: 'test' } }
    } as CustomAPIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )

describe('createDataset', () => {
  beforeEach(async () => {
    await clearDynamoTable(dynamoTables.datasetsTable)
  })

  it('should create a dataset and redirect', async () => {
    const dataset = mockCreateDataset()

    const result = await execute(dataset)

    const [record] = await getAll(dynamoTables.datasetsTable)
    expect(record.name).toEqual(dataset.name)
    expect(record.description).toEqual(dataset.description)
    expect(record.metrics).toStrictEqual(dataset.metrics)
    expect(record).toHaveProperty('id')
    expect(record).toHaveProperty('createdAt')
    expect(record).toHaveProperty('updatedAt')

    expect(result).toStrictEqual({
      statusCode: 201,
      headers: { Location: `/datasets/${record.id}` }
    })
  })

  it("should return an error if the json won't parse", async () => {
    const result = await createDataset(
      {
        body: 'notJson',
        requestContext: { authorizer: { user: 'test' } }
      } as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['JSON parsing error'] })
    })
  })

  it('should return an error if the body is missing', async () => {
    const result = await createDataset(
      {
        requestContext: { authorizer: { user: 'test' } }
      } as CustomAPIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Body is missing'] })
    })
  })

  it('should return an error if required attributes are missing', async () => {
    const dataset = mockCreateDataset({ name: undefined })

    const result = await execute(dataset)

    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Missing attribute: name'] })
    })
  })

  it('should return an error if the metric ids are invalid', async () => {
    const dataset = mockCreateDataset({ metrics: { 'metric one': {} } })

    const result = await execute(dataset)

    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({
        errors: [
          'Metric id must be alphanumeric (a-z, A-Z, 0-9, -, _) with no spaces'
        ]
      })
    })
  })

  it('should return an error if attributes are the wrong type', async () => {
    const dataset = mockCreateDataset({ name: 10 } as unknown as CreateDataset)

    const result = await execute(dataset)

    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({
        errors: ['Expected string, received number: name']
      })
    })
  })
})
