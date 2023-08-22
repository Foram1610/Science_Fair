const express = require('express')
const router = express.Router()
const project = require('../controllers/project.controller')
const authMiddleware = require('../middlewares/auth')
const { checkProject, valResult } = require('../middlewares/validation')

router.post('/project', authMiddleware, checkProject, valResult, project.addProject)
router.post('/_project', authMiddleware, project.getAllProject)
router.put('/project/:_id', authMiddleware, project.updateProject)
router.delete('/project/:_id', authMiddleware, project.deleteProject)
router.get('/project/:_id', authMiddleware, project.getProjectById)
router.post('/project/:_id', authMiddleware, project.projectStatusChange)
router.post('/project/assign/:_id', authMiddleware, project.assignStudent)
router.post('/projectCSV/:id', authMiddleware, project.convertToCSV)


module.exports = router