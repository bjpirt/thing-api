import { AllHttpMethods } from './DatasetKey'

export type UserAuthToken = {
  scope: 'user'
  user: string
}

export type DatasetAuthToken = {
  scope: 'dataset'
  id: string
  tokenId: string
  methods: AllHttpMethods[]
}

export type AuthToken = UserAuthToken | DatasetAuthToken
