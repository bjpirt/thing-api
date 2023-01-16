const jwtSecret = (process.env.JWT_SECRET = 'abc123')
process.env.DEFAULT_USER = 'testuser'
process.env.DEFAULT_PASSWORD_HASH = 'dummy'

import { AuthContext } from 'api/types/AuthContext'
import {
  APIGatewayRequestAuthorizerEventHeaders,
  APIGatewayRequestAuthorizerEventPathParameters,
  APIGatewayRequestAuthorizerEventV2,
  APIGatewaySimpleAuthorizerWithContextResult
} from 'aws-lambda'
import jwt from 'jsonwebtoken'
import { authorizer } from './authorizer'

const execute = (
  headers: APIGatewayRequestAuthorizerEventHeaders,
  pathParameters: APIGatewayRequestAuthorizerEventPathParameters = {},
  method = 'GET',
  rawPath = ''
): Promise<
  APIGatewaySimpleAuthorizerWithContextResult<
    AuthContext | Record<string, never>
  >
> =>
  authorizer({
    headers,
    pathParameters,
    rawPath,
    requestContext: { http: { method } }
  } as any as APIGatewayRequestAuthorizerEventV2)

describe('authorizer', () => {
  it('should accept a valid user token in the Authorization header', async () => {
    const validToken = jwt.sign({ scope: 'user', user: 'admin' }, jwtSecret)
    const result = await execute({ Authorization: `Bearer ${validToken}` })
    expect(result).toStrictEqual({
      isAuthorized: true,
      context: { user: 'admin' }
    })
  })

  it('should accept a valid dataset token for the right dataset and method', async () => {
    const datasetId = 'abcde12345'
    const validToken = jwt.sign(
      { scope: 'dataset', datasetId, methods: ['GET'] },
      jwtSecret
    )
    const result = await execute(
      { Authorization: `Bearer ${validToken}` },
      { datasetId },
      'GET',
      `/datasets/${datasetId}/metrics`
    )
    expect(result).toStrictEqual({
      isAuthorized: true,
      context: { datasetId }
    })
  })

  it('should accept a valid dataset token for the right dataset and method with wildcard method', async () => {
    const datasetId = 'abcde12345'
    const validToken = jwt.sign(
      { scope: 'dataset', datasetId, methods: ['*'] },
      jwtSecret
    )
    const result = await execute(
      { Authorization: `Bearer ${validToken}` },
      { datasetId },
      'POST',
      `/datasets/${datasetId}/metrics`
    )
    expect(result).toStrictEqual({
      isAuthorized: true,
      context: { datasetId }
    })
  })

  it('should deny a valid dataset token for the wrong dataset', async () => {
    const datasetId = 'abcde12345'
    const validToken = jwt.sign(
      { scope: 'dataset', datasetId, methods: ['GET'] },
      jwtSecret
    )
    const result = await execute(
      { Authorization: `Bearer ${validToken}` },
      { datasetId: 'fghij67890' },
      'GET',
      `/datasets/${datasetId}/metrics`
    )
    expect(result).toStrictEqual({
      isAuthorized: false,
      context: {}
    })
  })

  it('should deny a valid dataset token for the wrong method', async () => {
    const datasetId = 'abcde12345'
    const validToken = jwt.sign(
      { scope: 'dataset', datasetId, methods: ['POST'] },
      jwtSecret
    )
    const result = await execute(
      { Authorization: `Bearer ${validToken}` },
      { datasetId: 'fghij67890' },
      'GET',
      `/datasets/${datasetId}/metrics`
    )
    expect(result).toStrictEqual({
      isAuthorized: false,
      context: {}
    })
  })

  it('should deny access to other tokens for a valid dataset token', async () => {
    const datasetId = 'abcde12345'
    const validToken = jwt.sign(
      { scope: 'dataset', datasetId, methods: ['GET'] },
      jwtSecret
    )
    const result = await execute(
      { Authorization: `Bearer ${validToken}` },
      { datasetId: 'fghij67890' },
      'GET',
      `/datasets/${datasetId}/tokens`
    )
    expect(result).toStrictEqual({
      isAuthorized: false,
      context: {}
    })
  })

  it('should reject an invalid token in the Authorization header', async () => {
    const result = await execute({ Authorization: `Bearer invalidToken` })
    expect(result).toStrictEqual({
      isAuthorized: false,
      context: {}
    })
  })

  it('should reject a missing Authorization header', async () => {
    const result = await execute({})
    expect(result).toStrictEqual({
      isAuthorized: false,
      context: {}
    })
  })

  it('should reject if no headers are set', async () => {
    const result = await authorizer({} as APIGatewayRequestAuthorizerEventV2)
    expect(result).toStrictEqual({
      isAuthorized: false,
      context: {}
    })
  })
})
