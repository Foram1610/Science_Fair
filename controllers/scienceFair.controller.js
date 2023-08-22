const ScienceFair = require('../models/Science_fair')
const School = require('../models/School')
const Student = require('../models/Student')
const Project = require('../models/Project')
const User = require('../models/User')
const Result = require('../models/Result')
const paginate = require('../helper/paginate')

exports.addScienceFair = async (req, res) => {
    try {
        const { name, location, description, date } = req.body

        let curDate = new Date()
        let selectedDate = new Date(date)
        let diffTime = selectedDate - curDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return res.status(400).json({ message: 'Please select proper date for Science Fair!!' })
        }

        let image;
        if (req.file === undefined) {
            image = 'science-fair.webp'
        }
        else {
            image = req.file.filename;
        }

        const scienecfair = new ScienceFair({ name, location, description, date, image: image })
        const check = await scienecfair.save()
        if (!check) {
            return res.status(400).json({ message: 'not added!!!' })
        }

        return res.status(200).json({ message: 'Science Fair Added Successfully!!!' })
    }
    catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllScienceFair = async (req, res) => {
    try {
        const option = { ...req.body };
        if (!option.hasOwnProperty('query')) {
            option['query'] = {};
        }
        if (req.loginUserRole === 2) {
            const schoolCheck = await School.findOne({ _id: req.schoolId });
            option.query['_id'] = schoolCheck.scienceFairId;
        }
        if (req.loginUserRole === 3) {
            const user = await User.findOne({ _id: req.loginUserId });
            option.query['_id'] = user.scienceFairId;
        }
        const scienceFare = await paginate(option, ScienceFair);
        return res.status(200).json(scienceFare);
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllScienceFairPublic = async (req, res) => {
    try {
        const scienceFare = await paginate(req.body, ScienceFair);
        return res.status(200).json(scienceFare);
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.updateScienceFair = async (req, res) => {
    try {
        const { name, location, description, date } = req.body
        const img = await ScienceFair.findOne({ _id: req.params._id })
        let image
        if (req.file === undefined) {
            image = img.image
        }
        else {
            image = req.file.filename
        }
        const check = await ScienceFair.findOneAndUpdate({ _id: req.params._id },
            {
                name, location, description, date, image: image
            })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `Science Fair Updated Successfully!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getScienceFairById = async (req, res) => {
    try {
        const scienceFair = await ScienceFair.findOne({ _id: req.params._id })
            .select('-__v -createdAt -updatedAt')
        if (!scienceFair) {
            return res.status(400).json({ message: "ScienceFair not found!!" })
        }
        return res.status(200).json({ data: scienceFair })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.deleteScienceFair = async (req, res) => {
    try {
        const status = await ScienceFair.findOne({ _id: req.params._id })
        if (!status) {
            return res.status(400).json({ message: "This User is not exist!!" })
        }
        const checkStudent = await Student.find({ $and: [{ scienceFairId: status._id }, { isDeleted: false }] })
        const checkUser = await User.find({ $and: [{ scienceFairId: status._id }, { isDeleted: false }] })
        const checkProject = await Project.find({ $and: [{ scienceFairId: status._id }, { isDeleted: false }] })
        if (checkProject.length !== 0 && checkStudent.length !== 0 && checkUser.length !== 0) {
            return res.status(400).json({ message: "You cannot delete the science fair which already has assigned students, projects or users!!" })
        }
        if (status.isDeleted === true) {
            return res.status(400).json({ message: "This Science Fair is already deleted!!!" })
        }

        const check = await ScienceFair.findOneAndUpdate({ _id: req.params._id },
            {
                isActive: false,
                isDeleted: true
            })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `Science Fair Deleted Successfully!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.scienceFairStatusChange = async (req, res) => {
    try {
        let toggle = true
        const status = await ScienceFair.findOne({ $and: [{ _id: req.params._id }, { isDeleted: false }] })
        if (status.isActive === true) {
            toggle = false
        }
        const check = await ScienceFair.findOneAndUpdate({ _id: req.params._id },
            {
                isActive: toggle
            })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `Science Fair's status changed!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.scienceFairLock = async (req, res) => {
    try {
        let toggle = true
        const locked = await ScienceFair.findOne({ $and: [{ _id: req.params._id }, { isDeleted: false }] })
        if (locked.isLocked === true) {
            toggle = false
        }
        const check = await ScienceFair.findOneAndUpdate({ _id: req.params._id },
            {
                isLocked: toggle
            })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        if (toggle === true) {
            return res.status(200).json({ message: `Science Fair is Locked Now!!` })
        }
        else {
            return res.status(200).json({ message: `Science Fair is Unlocked Now!!` })
        }

    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.totalCounts = async (req, res) => {
    try {
        const resJson = { student: 0, project: 0 };
        const countFilter = [
            { scienceFairId: req.params._id }, { isDeleted: false }
        ]
        if (req.loginUserRole === 1) {
            const school = await School.find({ $and: countFilter });
            const userFilter = countFilter
            userFilter.push({ userRole: { $ne: 1 } })
            const user = await User.find({ $and: userFilter });
            const results = await Result.find({ $and: countFilter })
            const topScore = await Project.find({
                $and: [{ scienceFairId: req.params._id }, { isDeleted: false },
                { rank: { $lt: 4 } }, { averageScore: { $ne: 0 } }, { averageScore: { $ne: null } }]
            })
            resJson['school'] = school.length;
            resJson['users'] = user.length;
            resJson['result'] = results.length;
            resJson['topScore'] = topScore.length
        }

        if (req.loginUserRole === 2) {
            countFilter.push({ schoolId: req.schoolId });
        }

        const student = await Student.find({ $and: countFilter })
        const project = await Project.find({ $and: countFilter })
        resJson['student'] = student.length;
        resJson['project'] = project.length;
        return res.status(200).json(resJson)
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}
