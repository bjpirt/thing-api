import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context
} from 'aws-lambda'

export type Handler<TEvent = any, TResult = any> = (
  event: TEvent,
  context: Context,
  callback: Callback<TResult>
) => Promise<TResult>

type ApiHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>

export default ApiHandler
