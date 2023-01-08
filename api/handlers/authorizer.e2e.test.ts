import axios from 'axios'
import jwt from 'jsonwebtoken'

const jwtSecret = 'Fqn5J4mgbWzk'

describe('authorizer', () => {
  it('should accept a valid token in the Authorization header', async () => {
    const validToken = jwt.sign({ scope: 'user', user: 'admin' }, jwtSecret)
    const result = await axios.post(
      'http://localhost:6010/datasets',
      { name: 'foo', metrics: { metricOne: {} } },
      {
        headers: {
          Authorization: `Bearer ${validToken}`
        }
      }
    )
    expect(result.status).toBe(201)
  })

  it('should reject an invalid token in the Authorization header', async () => {
    const result = await axios.post(
      'http://localhost:6010/datasets',
      { name: 'foo', metrics: { metricOne: {} } },
      {
        validateStatus: null,
        headers: {
          Authorization: `Bearer invalidToken`
        }
      }
    )
    expect(result.status).toBe(403)
  })

  it('should reject a missing Authorization header', async () => {
    const result = await axios.post(
      'http://localhost:6010/datasets',
      {
        name: 'foo',
        metrics: { metricOne: {} }
      },
      {
        validateStatus: null
      }
    )
    expect(result.status).toBe(401)
  })
})
