const express = require('express')
const storeController = require('../controllers/storeController')
const { requireAuth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/validate')

const router = express.Router()

router.get('/', requireAuth, asyncHandler(storeController.listStores))

module.exports = router