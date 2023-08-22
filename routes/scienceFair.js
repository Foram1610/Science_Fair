const express = require('express')
const router = express.Router()
const scienceFair = require('../controllers/scienceFair.controller')
const authMiddleware = require('../middlewares/auth')
const imageMiddleware = require('../middlewares/image')
const { checkScienceFair, valResult } = require('../middlewares/validation')

router.post('/scienceFair', authMiddleware, imageMiddleware.single('image'), checkScienceFair, valResult, scienceFair.addScienceFair)
router.post('/_scienceFair', authMiddleware, scienceFair.getAllScienceFair)
router.post('/publicPage', scienceFair.getAllScienceFairPublic)
router.get('/scienceFair/:_id', authMiddleware, scienceFair.getScienceFairById)
router.put('/scienceFair/:_id', authMiddleware, imageMiddleware.single('image'), scienceFair.updateScienceFair)
router.delete('/scienceFair/:_id', authMiddleware, scienceFair.deleteScienceFair)
router.post('/scienceFair/:_id', authMiddleware, scienceFair.scienceFairStatusChange)
router.post('/scienceFair/locked/:_id', authMiddleware, scienceFair.scienceFairLock)
router.get('/scienceFair/totalData/:_id', authMiddleware, scienceFair.totalCounts)

module.exports = router