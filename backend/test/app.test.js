const test = require('node:test')
const assert = require('node:assert/strict')
const app = require('../app')

test('API health, input validation, and unauthenticated access behavior', async () => {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  const baseUrl = `http://127.0.0.1:${address.port}/api`

  try {
    const health = await fetch(`${baseUrl}/health`)
    assert.equal(health.status, 200)
    assert.deepEqual(await health.json(), { status: 'ok' })

    const login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '' }),
    })
    assert.equal(login.status, 400)
    assert.equal((await login.json()).error, 'Validation failed.')

    const admin = await fetch(`${baseUrl}/admin/stats`)
    assert.equal(admin.status, 401)
    assert.equal((await admin.json()).error, 'Authentication required.')
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})