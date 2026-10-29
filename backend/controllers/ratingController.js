const database = require('../config/database')
const { ApiError } = require('../middleware/validate')

async function upsertRating(req, res) {
	const storeId = Number(req.params.storeId)
	if (!Number.isInteger(storeId) || storeId < 1) throw new ApiError(400, 'Store ID is invalid.')

	const [stores] = await database.execute('SELECT id FROM stores WHERE id = ?', [storeId])
	if (!stores.length) throw new ApiError(404, 'Store not found.')

	const rating = Number(req.body.rating)
	await database.execute(
		`INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = UTC_TIMESTAMP()`,
		[req.user.id, storeId, rating],
	)
	res.json({ message: 'Rating saved.', rating })
}

async function ownerSummary(req, res) {
	const [stores] = await database.execute(
		`SELECT s.id, s.name, ROUND(AVG(r.rating), 2) AS average_rating, COUNT(r.id) AS rating_count
		 FROM stores s
		 LEFT JOIN ratings r ON r.store_id = s.id
		 WHERE s.owner_id = ?
		 GROUP BY s.id
		 ORDER BY s.name`,
		[req.user.id],
	)

	const [ratings] = await database.execute(
		`SELECT s.id AS store_id, s.name AS store_name, u.name AS user_name, u.email AS user_email,
						r.rating, r.created_at, r.updated_at
		 FROM ratings r
		 JOIN stores s ON s.id = r.store_id
		 JOIN users u ON u.id = r.user_id
		 WHERE s.owner_id = ?
		 ORDER BY r.updated_at DESC`,
		[req.user.id],
	)
	res.json({ stores, ratings })
}

module.exports = { ownerSummary, upsertRating }