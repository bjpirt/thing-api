export type Config = {
  jwtSecret: string
  defaultUser: string
  defaultPasswordHash: string
}

const jwtSecret = process.env.JWT_SECRET
const defaultUser = process.env.DEFAULT_USER ?? 'admin'
const defaultPasswordHash = process.env.DEFAULT_PASSWORD_HASH

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable must be set')
}

if (!defaultPasswordHash) {
  throw new Error('DEFAULT_PASSWORD_HASH environment variable must be set')
}

const config: Config = { jwtSecret, defaultUser, defaultPasswordHash }

export default config
