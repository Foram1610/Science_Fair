const express = require('express')
const router = express.Router()
const category = require('../controllers/category.controller')
const authMiddleware = require('../middlewares/auth')

router.post('/category',category.addCategory)
router.post('/_category', authMiddleware,category.getAllCategory)

module.exports = router