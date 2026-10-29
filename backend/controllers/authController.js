const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto')
const { promisify } = require('node:util')
const database = require('../config/database')
const { ApiError } = require('../middleware/validate')
const { hashSession, readCookie, sessionCookieName } = require('../middleware/auth')

const scryptAsync = promisify(scrypt)
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000

async function hashPassword(password) {
	const salt = randomBytes(16).toString('hex')
	const derivedKey = await scryptAsync(password, salt, 64)
	return `scrypt$${salt}$${derivedKey.toString('hex')}`
}

async function verifyPassword(password, storedHash) {
	const [scheme, salt, key] = String(storedHash).split('$')
	if (scheme !== 'scrypt' || !salt || !key) return false
	const expected = Buffer.from(key, 'hex')
	const actual = await scryptAsync(password, salt, expected.length)
	return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function publicUser(user) {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		address: user.address,
		role: user.role,
	}
}

async function createSession(userId, res) {
	const token = randomBytes(32).toString('base64url')
	await database.execute(
		'INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))',
		[hashSession(token), userId],
	)
	res.cookie(sessionCookieName, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.COOKIE_SAME_SITE || 'lax',
		path: '/',
		maxAge: sessionLifetimeMs,
	})
}

async function register(req, res) {
	const { name, email, address, password } = req.body
	const [result] = await database.execute(
		'INSERT INTO users (name, email, address, password_hash, role) VALUES (?, ?, ?, ?, ?)',
		[name.trim(), email.trim().toLowerCase(), address.trim(), await hashPassword(password), 'user'],
	)
	const user = { id: result.insertId, name: name.trim(), email: email.trim().toLowerCase(), address: address.trim(), role: 'user' }
	await createSession(user.id, res)
	res.status(201).json({ user })
}

async function login(req, res) {
	const email = req.body.email.trim().toLowerCase()
	const [rows] = await database.execute(
		'SELECT id, name, email, address, role, password_hash FROM users WHERE email = ? LIMIT 1',
		[email],
	)
	if (!rows.length || !(await verifyPassword(req.body.password, rows[0].password_hash))) {
		throw new ApiError(401, 'Email or password is incorrect.')
	}

	await createSession(rows[0].id, res)
	res.json({ user: publicUser(rows[0]) })
}

async function currentUser(req, res) {
	res.json({ user: req.user })
}

async function logout(req, res) {
	const token = readCookie(req, sessionCookieName)
	if (token) {
		await database.execute('DELETE FROM user_sessions WHERE token_hash = ?', [hashSession(token)])
	}
	res.clearCookie(sessionCookieName, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.COOKIE_SAME_SITE || 'lax',
		path: '/',
	})
	res.json({ message: 'Signed out.' })
}

async function changePassword(req, res) {
	const [rows] = await database.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id])
	if (!rows.length || !(await verifyPassword(req.body.currentPassword, rows[0].password_hash))) {
		throw new ApiError(400, 'Current password is incorrect.')
	}

	await database.execute('UPDATE users SET password_hash = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?', [
		await hashPassword(req.body.newPassword),
		req.user.id,
	])
	await database.execute('DELETE FROM user_sessions WHERE user_id = ? AND token_hash <> ?', [req.user.id, req.sessionHash])
	res.json({ message: 'Password updated.' })
}

module.exports = { changePassword, currentUser, hashPassword, login, logout, register }