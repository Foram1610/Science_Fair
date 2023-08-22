const express = require('express')
const router = express.Router()
const auth = require('./auth')
const user = require('./user')
const school = require('./school')
const scienceFair = require('./scienceFair')
const student = require('./student')
const category = require('./category')
const strand = require('./strand')
const project = require('./project')
const results = require('./results')

router.use(auth, user, school, scienceFair, student, category, strand, project, results)


module.exports = router