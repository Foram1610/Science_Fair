const express = require('express')
const router = express.Router()
const student = require('../controllers/student.controller')
const authMiddleware = require('../middlewares/auth')
const { checkStudent, valResult } = require('../middlewares/validation')

router.post('/student', authMiddleware, checkStudent, valResult, student.addStudent)
router.post('/_student', authMiddleware, student.getAllStudent)
router.post('/student/:_id', authMiddleware, student.studentStatusChange)
router.get('/student/:_id', authMiddleware, student.getStudentById)
router.put('/student/:_id', authMiddleware, student.updateStudent)
router.delete('/student/:_id', authMiddleware, student.deleteStudent)
router.post('/studentCSV/:id', authMiddleware, student.convertToCSV)

module.exports = router