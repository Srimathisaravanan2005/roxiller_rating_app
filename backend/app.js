require('dotenv').config()

const cors = require('cors')
const express = require('express')
const adminRoutes = require('./routes/adminRoutes')
const authRoutes = require('./routes/authRoutes')
const ratingRoutes = require('./routes/ratingRoutes')
const storeRoutes = require('./routes/storeRoutes')
const { ApiError } = require('./middleware/validate')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/stores', storeRoutes)
app.use('/api/ratings', ratingRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res, next) => {
  next(new ApiError(404, 'Endpoint not found.'))
})

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with that email or rating already exists.' })
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'The selected related record does not exist.' })
  }
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message, ...(error.details ? { details: error.details } : {}) })
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' })
  }
  console.error(error)
  return res.status(500).json({ error: 'An unexpected server error occurred.' })
})

if (require.main === module) {
  const port = process.env.PORT || 5000
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`)
  })
}

module.exports = app