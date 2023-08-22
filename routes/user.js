const express = require('express')
const router = express.Router()
// const { login, valResult } = require('../middleware/validation')
const user = require('../controllers/user.controller')
const authMiddleware = require('../middlewares/auth')
const avatarMiddleware = require('../middlewares/avatar')
const { checkUser, valResult } = require('../middlewares/validation')

router.post('/user', authMiddleware, avatarMiddleware.single('image'), checkUser, valResult, user.addUser)
router.put('/user/:_id', authMiddleware, avatarMiddleware.single('image'), user.updateUser)
router.delete('/user/:_id', authMiddleware, user.deleteUser)
router.get('/user/:_id', authMiddleware, user.getUserById)
router.post('/_user', authMiddleware, user.getAllUsers)
router.post('/user/:_id', authMiddleware, user.userStatusChange)
router.post('/userCSV/:id', authMiddleware, user.convertToCSV)

module.exports = router
