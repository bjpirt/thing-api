export type UserAuthContext = {
  user: string
}

export type DatasetAuthContext = {
  datasetId: string
}

export type NullAuthContext = Record<string, never>

type WorkaroundAuthContext = {
  lambda: AuthContextData
}

export type AuthContextData =
  | UserAuthContext
  | DatasetAuthContext
  | NullAuthContext

export type AuthContext = AuthContextData | WorkaroundAuthContext
