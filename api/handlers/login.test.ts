import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const jwtSecret = (process.env.JWT_SECRET = 'abc123')
const defaultUser = (process.env.DEFAULT_USER = 'testuser')
const defaultPassword = 'password'
process.env.DEFAULT_PASSWORD_HASH = bcrypt.hashSync(
  defaultPassword,
  bcrypt.genSaltSync(10)
)

import {
  APIGatewayProxyResultV2,
  APIGatewayProxyEventV2,
  Context,
  Callback
} from 'aws-lambda'
import { login } from './login'

const execute = (
  user: string,
  password: string
): Promise<APIGatewayProxyResultV2> =>
  login(
    {
      body: JSON.stringify({ user, password })
    } as unknown as APIGatewayProxyEventV2,
    {} as Context,
    {} as Callback<APIGatewayProxyResultV2>
  )
describe('login', () => {
  it('should return a valid token if the login was successful', async () => {
    const expectedExp = Math.floor(Date.now() / 1000) + 86400
    const loginResult = await execute(defaultUser, defaultPassword)
    expect(loginResult).toHaveProperty('statusCode', 200)
    const body = JSON.parse((loginResult as any).body)
    expect(body).toHaveProperty('token')
    const parsedToken = jwt.verify(body.token, jwtSecret)
    expect(parsedToken).toHaveProperty('scope', 'user')
    expect(parsedToken).toHaveProperty('user', 'testuser')
    expect(parsedToken).toHaveProperty('iat')
    const exp = (parsedToken as any).exp
    expect(exp).toBeGreaterThanOrEqual(expectedExp)
    expect(exp).toBeLessThan(expectedExp + 10)
  })

  it('should return a 401 if the password was wrong', async () => {
    const loginResult = await execute(defaultUser, 'notthepassword')
    expect(loginResult).toHaveProperty('statusCode', 401)
  })

  it('should return a 401 if the user was wrong', async () => {
    const loginResult = await execute('nottheuser', defaultPassword)
    expect(loginResult).toHaveProperty('statusCode', 401)
  })

  it("should return an error if the json won't parse", async () => {
    const result = await login(
      { body: 'notJson' } as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['JSON parsing error'] })
    })
  })

  it('should return an error if the body is missing', async () => {
    const result = await login(
      {} as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )
    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Body is missing'] })
    })
  })

  it('should return an error if required attributes are missing', async () => {
    const result = await login(
      {
        body: JSON.stringify({ user: 'foo' })
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Missing attribute: password'] })
    })
  })

  it('should return an error if the attribute is the wrong data type', async () => {
    const result = await login(
      {
        body: JSON.stringify({ user: 123, password: 'foo' })
      } as unknown as APIGatewayProxyEventV2,
      {} as Context,
      {} as Callback<APIGatewayProxyResultV2>
    )

    expect(result).toStrictEqual({
      statusCode: 400,
      body: JSON.stringify({
        errors: ['Expected string, received number: user']
      })
    })
  })
})
