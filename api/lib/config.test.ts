/* eslint @typescript-eslint/no-var-requires: off */
describe('config', () => {
  beforeEach(() => {
    jest.resetModules()
    delete process.env.JWT_SECRET
    delete process.env.DEFAULT_USER
    delete process.env.DEFAULT_PASSWORD_HASH
  })

  it('should extract environment variables', () => {
    process.env.JWT_SECRET = 'jwtSecret'
    process.env.DEFAULT_USER = 'admin'
    process.env.DEFAULT_PASSWORD_HASH = 'hash'
    const config = require('./config').default
    expect(config).toStrictEqual({
      jwtSecret: 'jwtSecret',
      defaultUser: 'admin',
      defaultPasswordHash: 'hash'
    })
  })

  it('should raise an exception if JWT_SECRET is not set', () => {
    process.env.DEFAULT_PASSWORD_HASH = 'set'
    expect(() => require('./config')).toThrow()
  })

  it('should raise an exception if DEFAULT_PASSWORD_HASH is not set', () => {
    process.env.JWT_SECRET = 'set'
    expect(() => require('./config')).toThrow()
  })
})
