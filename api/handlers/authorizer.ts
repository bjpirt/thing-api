import AuthContext from 'api/types/AuthContext'
import { AuthToken } from 'api/types/AuthToken'
import {
  APIGatewayRequestAuthorizerEventV2,
  APIGatewaySimpleAuthorizerWithContextResult
} from 'aws-lambda'
import jwt from 'jsonwebtoken'
import config from '../lib/config'

const extractTokenFromHeaders = (
  event: APIGatewayRequestAuthorizerEventV2
): AuthToken | false => {
  if (!event.headers) {
    return false
  }
  if (
    event.headers.Authorization &&
    event.headers.Authorization.startsWith('Bearer')
  ) {
    return decodeToken(event.headers.Authorization.replace('Bearer ', ''))
  }
  return false
}

const decodeToken = (token: string): AuthToken | false => {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthToken
  } catch (err) {
    return false
  }
}

const requestAllowed = (tokenPayload: AuthToken) => {
  return tokenPayload.scope === 'user'
}

export const authorizer = async (
  event: APIGatewayRequestAuthorizerEventV2
): Promise<APIGatewaySimpleAuthorizerWithContextResult<AuthContext>> => {
  const decodedToken = extractTokenFromHeaders(event)
  if (
    decodedToken &&
    requestAllowed(decodedToken) &&
    decodedToken.scope === 'user'
  ) {
    return {
      isAuthorized: true,
      context: { user: decodedToken.user }
    }
  }

  return {
    isAuthorized: false,
    context: { user: null }
  }
}
