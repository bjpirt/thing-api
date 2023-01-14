import formatZodErrors from 'api/lib/formatZodErrors'
import generateToken from 'api/lib/generateToken'
import { loginRequestSchema } from 'api/types/LoginRequest'
import { send200, send400, send401 } from '../lib/httpResponses'
import ApiHandler from '../types/ApiHandler'
import checkPassword from '../lib/checkPassword'

export const login: ApiHandler = async (event) => {
  if (!event.body) {
    return send400({ errors: ['Body is missing'] })
  }

  try {
    const inputData = loginRequestSchema.safeParse(JSON.parse(event.body))
    if (!inputData.success) {
      return send400({
        errors: formatZodErrors(inputData.error)
      })
    }

    const loginSuccess = await checkPassword(inputData.data)

    return loginSuccess
      ? send200(
          JSON.stringify({
            token: generateToken({ scope: 'user', user: inputData.data.user })
          })
        )
      : send401()
  } catch (e: unknown) {
    return send400({ errors: ['JSON parsing error'] })
  }
}
