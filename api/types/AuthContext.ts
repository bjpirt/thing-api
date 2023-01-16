export type UserAuthContext = {
  user: string
}

export type DatasetAuthContext = {
  datasetId: string
}

export type NullAuthContext = Record<string, never>

export type AuthContext = UserAuthContext | DatasetAuthContext | NullAuthContext
