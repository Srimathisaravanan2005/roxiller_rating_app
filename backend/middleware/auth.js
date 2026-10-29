const { createHash } = require('node:crypto')
const database = require('../config/database')
const { ApiError, asyncHandler } = require('./validate')

const sessionCookieName = 'roxillar_session'

function readCookie(req, name) {
	const cookieHeader = req.headers.cookie || ''
	const match = cookieHeader.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`))
	return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

function hashSession(token) {
	return createHash('sha256').update(token).digest('hex')
}

const requireAuth = asyncHandler(async (req, res, next) => {
	const token = readCookie(req, sessionCookieName)
	if (!token) throw new ApiError(401, 'Authentication required.')

	const [rows] = await database.execute(
		`SELECT u.id, u.name, u.email, u.address, u.role
		 FROM user_sessions s
		 JOIN users u ON u.id = s.user_id
		 WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()
		 LIMIT 1`,
		[hashSession(token)],
	)

	if (!rows.length) throw new ApiError(401, 'Session expired. Please sign in again.')
	req.user = rows[0]
	req.sessionHash = hashSession(token)
	next()
})

function requireRole(...roles) {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return next(new ApiError(403, 'You do not have permission to perform this action.'))
		}
		next()
	}
}

module.exports = { hashSession, readCookie, requireAuth, requireRole, sessionCookieName }