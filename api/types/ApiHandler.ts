import {
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2WithRequestContext,
  APIGatewayProxyResultV2,
  Callback,
  Context
} from 'aws-lambda'
import AuthContext from './AuthContext'

export type Handler<TEvent = any, TResult = any> = (
  event: TEvent,
  context: Context,
  callback: Callback<TResult>
) => Promise<TResult>

type CustomAPIGatewayEventRequestContextV2 = APIGatewayEventRequestContextV2 & {
  authorizer?: AuthContext
}

export type CustomAPIGatewayProxyEventV2 =
  APIGatewayProxyEventV2WithRequestContext<CustomAPIGatewayEventRequestContextV2>

type ApiHandler = Handler<CustomAPIGatewayProxyEventV2, APIGatewayProxyResultV2>

export default ApiHandler
