import { AuthContext } from 'api/types/AuthContext'
import { AuthToken } from 'api/types/AuthToken'
import { HttpMethods } from 'api/types/DatasetToken'
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

const requestAllowed = (
  tokenPayload: AuthToken,
  event: APIGatewayRequestAuthorizerEventV2
) => {
  if (tokenPayload.scope === 'user') {
    return true
  }
  if (tokenPayload.scope === 'dataset') {
    const datasetId = event.pathParameters?.datasetId
    if (
      event.rawPath.startsWith(`/datasets/${datasetId}`) &&
      !event.rawPath.includes('/tokens')
    ) {
      if (tokenPayload.methods[0] === '*') {
        return true
      }
      const method = event.requestContext.http.method.toUpperCase()
      if (tokenPayload.methods.includes(method as HttpMethods)) {
        return true
      }
    }
  }
  return false
}

export const authorizer = async (
  event: APIGatewayRequestAuthorizerEventV2
): Promise<
  APIGatewaySimpleAuthorizerWithContextResult<
    AuthContext | Record<string, never>
  >
> => {
  const decodedToken = extractTokenFromHeaders(event)

  if (decodedToken && requestAllowed(decodedToken, event)) {
    const context =
      decodedToken.scope === 'user'
        ? { user: decodedToken.user }
        : { datasetId: decodedToken.datasetId }

    return {
      isAuthorized: true,
      context
    }
  }

  return {
    isAuthorized: false,
    context: {}
  }
}
