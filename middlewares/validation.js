const { check, validationResult } = require('express-validator')

exports.checkUser = [
    check('firstName').trim().not().isEmpty().withMessage('FirstName is required!!!'),
    check('lastName').trim().not().isEmpty().withMessage('LastName is required!!!'),
    check('email').isEmail().withMessage("Please enter proper emailid!!"),
    check('userRole').trim().not().isEmpty().withMessage('User Role is required!!!'),
    check('password').trim().not().isEmpty().withMessage('password is required!!!').isLength({ min: 8 }).not().withMessage("Password's length must be 8 digit!!")
]

exports.checkScienceFair = [
    check('name').trim().not().isEmpty().withMessage('Name is required!!!'),
    check('date').trim().not().isEmpty().withMessage('Date is required!!!'),
    check('location').trim().not().isEmpty().withMessage('Location is required!!!')
]

exports.checkSchool = [
    check('name').trim().not().isEmpty().withMessage('Schoo Name is required!!!'),
    check('scienceFairId').trim().not().isEmpty().withMessage('Please select science fair!!!'),
    check('location').trim().not().isEmpty().withMessage('Location is required!!!')
]

exports.checkStudent = [
    check('firstName').trim().not().isEmpty().withMessage('FirstName is required!!!'),
    check('lastName').trim().not().isEmpty().withMessage('LastName is required!!!'),
    check('scienceFairId').trim().not().isEmpty().withMessage('Please select science fair!!!'),
    check('schoolId').trim().not().isEmpty().withMessage('Please select school!!!'),
    check('grade').trim().not().isEmpty().withMessage('Grade is required!!!'),
]

exports.checkProject = [
    check('name').trim().not().isEmpty().withMessage('Project name is required!!!'),
    check('strandId').trim().not().isEmpty().withMessage('Please select strand!!!'),
    check('categoryId').trim().not().isEmpty().withMessage('Please select category!!!'),
    check('schoolId').trim().not().isEmpty().withMessage('Please select school!!!'),
    check('scienceFairId').trim().not().isEmpty().withMessage('Please select science fair!!!'),
]

exports.login = [
    check('username').trim().not().isEmpty().withMessage('Username is required!!!'),
    check('password').trim().not().isEmpty().withMessage('password is required!!!')
]

exports.valResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = errors.array()[0].msg;
        return res.status(422).json({ success: false, error: error })
    }
    next();
};