const express = require('express')
const adminController = require('../controllers/adminController')
const { requireAuth, requireRole } = require('../middleware/auth')
const { asyncHandler, validateAdminUser, validateRequest, validateStore } = require('../middleware/validate')

const router = express.Router()

router.use(requireAuth, requireRole('admin'))
router.get('/stats', asyncHandler(adminController.statistics))
router.get('/users', asyncHandler(adminController.listUsers))
router.get('/users/:userId', asyncHandler(adminController.userDetails))
router.post('/users', validateRequest(validateAdminUser), asyncHandler(adminController.createUser))
router.get('/stores', asyncHandler(adminController.listStores))
router.post('/stores', validateRequest(validateStore), asyncHandler(adminController.createStore))

module.exports = router