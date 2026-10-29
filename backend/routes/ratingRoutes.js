const express = require('express')
const ratingController = require('../controllers/ratingController')
const { requireAuth, requireRole } = require('../middleware/auth')
const { asyncHandler, validateRating, validateRequest } = require('../middleware/validate')

const router = express.Router()

router.get('/owner', requireAuth, requireRole('store_owner'), asyncHandler(ratingController.ownerSummary))
router.put('/:storeId', requireAuth, requireRole('user'), validateRequest(validateRating), asyncHandler(ratingController.upsertRating))

module.exports = router