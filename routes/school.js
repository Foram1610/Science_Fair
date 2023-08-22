const express = require('express')
const router = express.Router()
const school = require('../controllers/school.controller')
const authMiddleware = require('../middlewares/auth')
const { checkSchool, valResult } = require('../middlewares/validation')

router.post('/school', authMiddleware, checkSchool, valResult, school.addSchool)
router.post('/_school', authMiddleware, school.getAllSchool)
router.get('/school/:_id', authMiddleware, school.getSchoolById)
router.put('/school/:_id', authMiddleware, school.updateSchool)
router.delete('/school/:_id', authMiddleware, school.deleteSchool)

module.exports = router