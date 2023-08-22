const express = require('express')
const router = express.Router()
const auth = require('../controllers/auth.controller')
const authMiddleware = require('../middlewares/auth')
const { checkUser, login, valResult } = require('../middlewares/validation')
router.post('/login', login, valResult, auth.login)
router.get('/me', authMiddleware, auth.me)
// router.post('/forgotpasswordLink', auth.forgotPassLink)
// router.post('/forgotpassword', auth.forgotPassword)

module.exports = router
