import { LoginRequest } from 'api/types/LoginRequest'
import bcrypt from 'bcryptjs'
import config from './config'

const checkPassword = async (loginData: LoginRequest): Promise<boolean> => {
  if (loginData.user !== config.defaultUser) {
    return false
  }
  return await bcrypt.compare(loginData.password, config.defaultPasswordHash)
}

export default checkPassword
