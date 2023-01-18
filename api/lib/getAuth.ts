import { CustomAPIGatewayProxyEventV2 } from 'api/types/ApiHandler'

export const getUser = (
  event: CustomAPIGatewayProxyEventV2
): string | undefined => {
  const authContext =
    event.requestContext?.authorizer?.lambda ?? event.requestContext?.authorizer
  if (authContext && 'user' in authContext) {
    return authContext.user
  }
}

export const getDatasetId = (
  event: CustomAPIGatewayProxyEventV2
): string | undefined => {
  const authContext =
    event.requestContext?.authorizer?.lambda ?? event.requestContext?.authorizer
  if (authContext && 'datasetId' in authContext) {
    return authContext.datasetId
  }
}
