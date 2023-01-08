import { Result } from 'api/types/Result'
import jwt from 'jsonwebtoken'
import config from './config'

type GenerateTokenOptions = {
  user?: string
  dataset?: string
}

const generateToken = (options: GenerateTokenOptions): Result<string> => {
  if (options.user) {
    const payload = { scope: 'user', user: options.user }
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: '1d'
    })
  }
  return new Error('Invalid configuration')
}

export default generateToken
