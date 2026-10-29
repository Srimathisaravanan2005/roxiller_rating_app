const database = require('../config/database')

async function listStores(req, res) {
	const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
	const sortColumns = {
		name: 's.name',
		email: 's.email',
		address: 's.address',
		average_rating: 'average_rating',
	}
	const sortBy = sortColumns[req.query.sortBy] ? req.query.sortBy : 'name'
	const direction = String(req.query.direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC'
	const filters = []
	const values = [req.user.id, `%${search}%`, `%${search}%`]

	if (req.user.role === 'store_owner') {
		filters.push('s.owner_id = ?')
		values.push(req.user.id)
	}

	const [stores] = await database.execute(
		`SELECT s.id, s.name, s.email, s.address, s.owner_id, owner.name AS owner_name,
						ROUND(AVG(r.rating), 2) AS average_rating, COUNT(r.id) AS rating_count,
						MAX(CASE WHEN r.user_id = ? THEN r.rating END) AS user_rating
		 FROM stores s
		 LEFT JOIN users owner ON owner.id = s.owner_id
		 LEFT JOIN ratings r ON r.store_id = s.id
		 WHERE (s.name LIKE ? OR s.address LIKE ?) ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
		 GROUP BY s.id
		 ORDER BY ${sortColumns[sortBy]} ${direction}`,
		values,
	)

	res.json({ stores })
}

module.exports = { listStores }