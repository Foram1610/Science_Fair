const express = require('express')
const router = express.Router()
const results = require('../controllers/result.controller')
const authMiddleware = require('../middlewares/auth')

router.post('/result', authMiddleware,results.addScore)
router.post('/_result', authMiddleware,results.getAllResults)
router.post('/rawResultCSV/:id',authMiddleware,results.convertToCSV)
router.get('/result/:_id', authMiddleware,results.getResultById)
// router.post('/result/:_id', authMiddleware,results.feedbackApproval)
router.post('/result/:_id', authMiddleware,results.feedbackUpdate)
router.post('/TopScore',authMiddleware,results.getTopScore)
router.post('/AllScore',authMiddleware,results.getAllProjects)
router.post('/CSV',authMiddleware,results.ConvertCSVFile)
router.get('/CSVExport/:fileName',results.downloadFiles)

module.exports = router