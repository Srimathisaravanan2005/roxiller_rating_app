class ApiError extends Error {
	constructor(status, message, details) {
		super(message)
		this.status = status
		this.details = details
	}
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPattern = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/

function validatePerson(body, { allowRoles = false } = {}) {
	const errors = {}
	const name = typeof body.name === 'string' ? body.name.trim() : ''
	const email = typeof body.email === 'string' ? body.email.trim() : ''
	const address = typeof body.address === 'string' ? body.address.trim() : ''

	if (name.length < 20 || name.length > 60) {
		errors.name = 'Name must be between 20 and 60 characters.'
	}
	if (!emailPattern.test(email)) errors.email = 'Enter a valid email address.'
	if (!address || address.length > 400) errors.address = 'Address is required and must be 400 characters or fewer.'
	if (!passwordPattern.test(body.password || '')) {
		errors.password = 'Password must be 8 to 16 characters, with an uppercase letter and a special character.'
	}
	if (allowRoles && !['admin', 'user', 'store_owner'].includes(body.role)) {
		errors.role = 'Choose a valid user role.'
	}

	return errors
}

function validateRegistration(body) {
	return validatePerson(body)
}

function validateAdminUser(body) {
	return validatePerson(body, { allowRoles: true })
}

function validateLogin(body) {
	const errors = {}
	if (!emailPattern.test(typeof body.email === 'string' ? body.email.trim() : '')) {
		errors.email = 'Enter a valid email address.'
	}
	if (typeof body.password !== 'string' || !body.password) {
		errors.password = 'Password is required.'
	}
	return errors
}

function validatePasswordChange(body) {
	const errors = {}
	if (typeof body.currentPassword !== 'string' || !body.currentPassword) {
		errors.currentPassword = 'Current password is required.'
	}
	if (!passwordPattern.test(body.newPassword || '')) {
		errors.newPassword = 'Password must be 8 to 16 characters, with an uppercase letter and a special character.'
	}
	return errors
}

function validateStore(body) {
	const errors = {}
	const name = typeof body.name === 'string' ? body.name.trim() : ''
	const email = typeof body.email === 'string' ? body.email.trim() : ''
	const address = typeof body.address === 'string' ? body.address.trim() : ''
	const ownerId = body.ownerId === '' || body.ownerId == null ? null : Number(body.ownerId)

	if (!name || name.length > 120) errors.name = 'Store name is required and must be 120 characters or fewer.'
	if (!emailPattern.test(email)) errors.email = 'Enter a valid store email address.'
	if (!address || address.length > 400) errors.address = 'Store address is required and must be 400 characters or fewer.'
	if (ownerId !== null && (!Number.isInteger(ownerId) || ownerId < 1)) {
		errors.ownerId = 'Select a valid store owner.'
	}
	return errors
}

function validateRating(body) {
	const rating = body.rating
	return Number.isInteger(rating) && rating >= 1 && rating <= 5
		? {}
		: { rating: 'Rating must be a whole number from 1 to 5.' }
}

function validateRequest(validator) {
	return (req, res, next) => {
		const errors = validator(req.body || {})
		if (Object.keys(errors).length) {
			return res.status(400).json({ error: 'Validation failed.', details: errors })
		}
		next()
	}
}

function asyncHandler(handler) {
	return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

module.exports = {
	ApiError,
	asyncHandler,
	validateAdminUser,
	validateLogin,
	validatePasswordChange,
	validateRating,
	validateRegistration,
	validateRequest,
	validateStore,
}