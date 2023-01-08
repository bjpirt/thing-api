const jwtSecret = (process.env.JWT_SECRET = 'abc123')
process.env.DEFAULT_USER = 'testuser'
process.env.DEFAULT_PASSWORD_HASH = 'dummy'

import AuthContext from 'api/types/AuthContext'
import {
  APIGatewayRequestAuthorizerEventHeaders,
  APIGatewayRequestAuthorizerEventV2,
  APIGatewaySimpleAuthorizerWithContextResult
} from 'aws-lambda'
import jwt from 'jsonwebtoken'
import { authorizer } from './authorizer'

const execute = (
  headers: APIGatewayRequestAuthorizerEventHeaders
): Promise<APIGatewaySimpleAuthorizerWithContextResult<AuthContext>> =>
  authorizer({
    headers
  } as APIGatewayRequestAuthorizerEventV2)

describe('authorizer', () => {
  it('should accept a valid token in the Authorization header', async () => {
    const validToken = jwt.sign({ scope: 'user', user: 'admin' }, jwtSecret)
    const result = await execute({ Authorization: `Bearer ${validToken}` })
    expect(result).toStrictEqual({
      isAuthorized: true,
      context: { user: 'admin' }
    })
  })

  it('should reject an invalid token in the Authorization header', async () => {
    const result = await execute({ Authorization: `Bearer invalidToken` })
    expect(result).toStrictEqual({
      isAuthorized: false,
      context: { user: null }
    })
  })

  it('should reject a missing Authorization header', async () => {
    const result = await execute({})
    expect(result).toStrictEqual({
      isAuthorized: false,
      context: { user: null }
    })
  })

  it('should reject if no headers are set', async () => {
    const result = await authorizer({} as APIGatewayRequestAuthorizerEventV2)
    expect(result).toStrictEqual({
      isAuthorized: false,
      context: { user: null }
    })
  })
})
