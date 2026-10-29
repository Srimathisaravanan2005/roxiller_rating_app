const test = require('node:test')
const assert = require('node:assert/strict')
const {
  validateAdminUser,
  validateLogin,
  validatePasswordChange,
  validateRating,
  validateRegistration,
  validateStore,
} = require('../middleware/validate')

const validPerson = {
  name: 'Roxillar Community Member',
  email: 'member@example.com',
  address: '12 Market Street',
  password: 'StrongPass!1',
}

test('normal-user registration accepts valid profile data', () => {
  assert.deepEqual(validateRegistration(validPerson), {})
})

test('registration rejects short names, missing addresses, malformed emails, and weak passwords', () => {
  const errors = validateRegistration({ ...validPerson, name: 'Too short', address: '', email: 'invalid', password: 'password' })
  assert.ok(errors.name)
  assert.ok(errors.address)
  assert.ok(errors.email)
  assert.ok(errors.password)
})

test('admin account creation requires an allowed role', () => {
  assert.ok(validateAdminUser({ ...validPerson, role: 'superuser' }).role)
  assert.deepEqual(validateAdminUser({ ...validPerson, role: 'store_owner' }), {})
})

test('login and password change reject missing credentials and weak new passwords', () => {
  assert.ok(validateLogin({ email: 'bad', password: '' }).email)
  assert.ok(validatePasswordChange({ currentPassword: 'old', newPassword: 'weakpass' }).newPassword)
  assert.deepEqual(validatePasswordChange({ currentPassword: 'old', newPassword: 'StrongPass!1' }), {})
})

test('ratings must be integer values between one and five', () => {
  for (const rating of [1, 2, 3, 4, 5]) assert.deepEqual(validateRating({ rating }), {})
  for (const rating of [0, 6, 2.5, '2', '2.5', 'not a rating']) assert.ok(validateRating({ rating }).rating)
})

test('store creation requires valid store fields and a positive owner ID when supplied', () => {
  const store = { name: 'Corner Books', email: 'hello@example.com', address: '1 Main Street', ownerId: 7 }
  assert.deepEqual(validateStore(store), {})
  assert.ok(validateStore({ ...store, ownerId: -1 }).ownerId)
})