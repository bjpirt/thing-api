export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | '*'

export type UserAuthToken = {
  scope: 'user'
  user: string
}

export type DatasetAuthToken = {
  scope: 'dataset'
  datasetId: string
  methods: HttpMethod[]
}

export type AuthToken = UserAuthToken | DatasetAuthToken
