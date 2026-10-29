const database = require('../config/database')
const { hashPassword } = require('./authController')
const { ApiError } = require('../middleware/validate')

async function statistics(req, res) {
	const [rows] = await database.execute(
		`SELECT (SELECT COUNT(*) FROM users) AS total_users,
						(SELECT COUNT(*) FROM stores) AS total_stores,
						(SELECT COUNT(*) FROM ratings) AS total_ratings`,
	)
	res.json({ statistics: rows[0] })
}

async function listUsers(req, res) {
	const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
	const role = ['admin', 'user', 'store_owner'].includes(req.query.role) ? req.query.role : ''
	const sortColumns = { name: 'name', email: 'email', address: 'address', role: 'role' }
	const sortBy = sortColumns[req.query.sortBy] ? req.query.sortBy : 'name'
	const direction = String(req.query.direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC'
	const filters = ['(name LIKE ? OR email LIKE ? OR address LIKE ?)']
	const values = [`%${search}%`, `%${search}%`, `%${search}%`]
	if (role) {
		filters.push('role = ?')
		values.push(role)
	}

	const [users] = await database.execute(
		`SELECT id, name, email, address, role, created_at FROM users
		 WHERE ${filters.join(' AND ')} ORDER BY ${sortColumns[sortBy]} ${direction}`,
		values,
	)
	res.json({ users })
}

async function userDetails(req, res) {
	const userId = Number(req.params.userId)
	if (!Number.isInteger(userId) || userId < 1) throw new ApiError(400, 'User ID is invalid.')
	const [users] = await database.execute(
		'SELECT id, name, email, address, role, created_at FROM users WHERE id = ? LIMIT 1',
		[userId],
	)
	if (!users.length) throw new ApiError(404, 'User not found.')

	let stores = []
	if (users[0].role === 'store_owner') {
		const [ownerStores] = await database.execute(
			`SELECT s.id, s.name, s.email, s.address, ROUND(AVG(r.rating), 2) AS average_rating,
							COUNT(r.id) AS rating_count
			 FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
			 WHERE s.owner_id = ? GROUP BY s.id ORDER BY s.name`,
			[userId],
		)
		stores = ownerStores
	}
	res.json({ user: users[0], stores })
}

async function createUser(req, res) {
	const { name, email, address, password, role } = req.body
	const [result] = await database.execute(
		'INSERT INTO users (name, email, address, password_hash, role) VALUES (?, ?, ?, ?, ?)',
		[name.trim(), email.trim().toLowerCase(), address.trim(), await hashPassword(password), role],
	)
	res.status(201).json({
		user: { id: result.insertId, name: name.trim(), email: email.trim().toLowerCase(), address: address.trim(), role },
	})
}

async function createStore(req, res) {
	const { name, email, address } = req.body
	const ownerId = req.body.ownerId === '' || req.body.ownerId == null ? null : Number(req.body.ownerId)
	if (ownerId !== null) {
		const [owners] = await database.execute('SELECT id FROM users WHERE id = ? AND role = ?', [ownerId, 'store_owner'])
		if (!owners.length) throw new ApiError(400, 'Selected owner is not a registered store owner.')
	}

	const [result] = await database.execute(
		'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
		[name.trim(), email.trim().toLowerCase(), address.trim(), ownerId],
	)
	res.status(201).json({ store: { id: result.insertId, name: name.trim(), email: email.trim().toLowerCase(), address: address.trim(), owner_id: ownerId } })
}

async function listStores(req, res) {
	const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
	const sortColumns = { name: 's.name', email: 's.email', address: 's.address', average_rating: 'average_rating' }
	const sortBy = sortColumns[req.query.sortBy] ? req.query.sortBy : 'name'
	const direction = String(req.query.direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC'
	const [stores] = await database.execute(
		`SELECT s.id, s.name, s.email, s.address, s.owner_id, owner.name AS owner_name,
						ROUND(AVG(r.rating), 2) AS average_rating, COUNT(r.id) AS rating_count
		 FROM stores s LEFT JOIN users owner ON owner.id = s.owner_id
		 LEFT JOIN ratings r ON r.store_id = s.id
		 WHERE s.name LIKE ? OR s.email LIKE ? OR s.address LIKE ?
		 GROUP BY s.id ORDER BY ${sortColumns[sortBy]} ${direction}`,
		[`%${search}%`, `%${search}%`, `%${search}%`],
	)
	res.json({ stores })
}

module.exports = { createStore, createUser, listStores, listUsers, statistics, userDetails }