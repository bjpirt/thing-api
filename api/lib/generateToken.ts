import { AuthToken } from 'api/types/AuthToken'
import { Result } from 'api/types/Result'
import jwt from 'jsonwebtoken'
import config from './config'

const generateToken = (payload: AuthToken): Result<string> => {
  const jwtConfig = payload.scope === 'user' ? { expiresIn: '1d' } : {}

  return jwt.sign(payload, config.jwtSecret, jwtConfig)
}

export default generateToken
