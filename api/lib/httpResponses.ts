import { APIGatewayProxyResultV2 } from 'aws-lambda'
import ErrorResponse from '../types/ErrorResponse'

export const send400 = (content: ErrorResponse): APIGatewayProxyResultV2 => ({
  statusCode: 400,
  body: JSON.stringify(content)
})

export const send401 = (): APIGatewayProxyResultV2 => ({
  statusCode: 401
})

export const send404 = (): APIGatewayProxyResultV2 => ({
  statusCode: 404
})

export const send500 = (
  content: ErrorResponse = { errors: ['Unknown server error'] }
): APIGatewayProxyResultV2 => ({
  statusCode: 500,
  body: JSON.stringify(content)
})

type Headers = {
  [k: string]: string
}

export const send200 = (body: string): APIGatewayProxyResultV2 => ({
  statusCode: 200,
  body
})

export const send201 = (headers: Headers): APIGatewayProxyResultV2 => ({
  statusCode: 201,
  headers
})

export const send204 = (): APIGatewayProxyResultV2 => ({
  statusCode: 204
})
