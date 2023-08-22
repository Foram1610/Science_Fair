const express = require('express')
const router = express.Router()
const strand = require('../controllers/strand.controller')
const authMiddleware = require('../middlewares/auth')

router.post('/strand',strand.addStrand)
router.post('/_strand', authMiddleware,strand.getAllStrand)

module.exports = router