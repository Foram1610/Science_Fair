const School = require('../models/School')
const User = require('../models/User')
const Student = require('../models/Student')
const Project = require('../models/Project')
const paginate = require('../helper/paginate');
exports.addSchool = async (req, res) => {
    try {
        const { name, location, scienceFairId, schoolCode } = req.body
        // let code = 'SCH001'
        // const schools = await School.find({ scienceFairId: scienceFairId }).sort({ createdAt: -1 })
        // if (schools) {
        //     const schCode = schools[0]
        //     const getCode = (schCode.schoolCode).substr(3)
        //     const gc = parseFloat(getCode) + 1
        //     if (`${gc}`.length === 1) {
        //         code = 'SCH' + "00" + gc
        //     }
        //     else {
        //         code = 'SCH' + "0" + gc
        //     }
        // }
        // const school = new School({ name, location, scienceFairId, schoolCode: code })

        const schools = await School.find({ $and: [{ scienceFairId: scienceFairId }, { schoolCode: schoolCode }] })
        if (schools.length !== 0) {
            return res.status(400).json({ message: 'This school code is already generated for other school!!!' })
        }

        const school = new School({ name, location, scienceFairId, schoolCode })
        const check = await school.save()
        if (!check) {
            return res.status(400).json({ message: 'School Not Added!!' })
        }
        return res.status(200).json({ message: 'School Added Successfully!!' })
    }
    catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllSchool = async (req, res) => {
    try {
        const option = { ...req.body };
        if (!option.hasOwnProperty('query')) {
            option['query'] = {};
        }
        if (req.loginUserRole === 2) {
            const schoolCheck = await School.findOne({ _id: req.schoolId });
            option.query['scienceFairId'] = schoolCheck.scienceFairId;
            option.query['schoolId'] = schoolCheck._id;
        }
        option.query['isDeleted'] = false;
        const school = await paginate(option, School);
        return res.status(200).json(school);
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getSchoolById = async (req, res) => {
    try {
        const data = await School.findOne({ _id: req.params._id })
        if (!data) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ data: data })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.updateSchool = async (req, res) => {
    try {
        const { name, location, schoolCode } = req.body
        const schoolSci = await School.findById(req.params._id)
        const schools = await School.find({ $and: [{ scienceFairId: schoolSci.scienceFairId }, { schoolCode: schoolCode }] })

        if (schools.length !== 0 && schoolCode !== schoolSci.schoolCode) {
            return res.status(400).json({ message: 'This school code is already generated for other school!!!' })
        }

        const check = await School.findOneAndUpdate({ _id: req.params._id },
            { name, location, schoolCode })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `School Updated Successfully!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.deleteSchool = async (req, res) => {
    try {
        const status = await School.findOne({ _id: req.params._id })
        if (!status) {
            return res.status(400).json({ message: "This Project is not exist!!" })
        }
        const checkStudent = await Student.find({ $and: [{ schoolId: status._id }, { isDeleted: false }] })
        const checkUser = await User.find({ $and: [{ schoolId: status._id }, { isDeleted: false }] })
        const checkProject = await Project.find({ $and: [{ schoolId: status._id }, { isDeleted: false }] })
        if (checkStudent.length !== 0 || checkUser.length !== 0 || checkProject.length !== 0) {
            return res.status(400).json({ message: "You cannot delete the school, that already has school admins or students or projects!!" })
        }
        if (status.isDeleted === true) {
            return res.status(400).json({ message: "This school is already deleted!!!" })
        }
        const check = await School.findOneAndUpdate({ _id: req.params._id },
            {
                isActive: false,
                isDeleted: true,
                schoolCode : ""
            })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `School Deleted Successfully!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}