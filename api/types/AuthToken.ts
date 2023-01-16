import { AllHttpMethods } from './DatasetToken'

export type UserAuthToken = {
  scope: 'user'
  user: string
}

export type DatasetAuthToken = {
  scope: 'dataset'
  datasetId: string
  tokenId: string
  methods: AllHttpMethods[]
}

export type AuthToken = UserAuthToken | DatasetAuthToken
