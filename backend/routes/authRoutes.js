const express = require('express')
const authController = require('../controllers/authController')
const { requireAuth } = require('../middleware/auth')
const { asyncHandler, validateLogin, validatePasswordChange, validateRegistration, validateRequest } = require('../middleware/validate')

const router = express.Router()

router.post('/register', validateRequest(validateRegistration), asyncHandler(authController.register))
router.post('/login', validateRequest(validateLogin), asyncHandler(authController.login))
router.get('/me', requireAuth, asyncHandler(authController.currentUser))
router.patch('/password', requireAuth, validateRequest(validatePasswordChange), asyncHandler(authController.changePassword))
router.post('/logout', asyncHandler(authController.logout))

module.exports = router