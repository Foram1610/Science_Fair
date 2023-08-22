const Student = require('../models/Student')
const Project = require('../models/Project')
const paginate = require('../helper/paginate');
const csvFileDownload = require('../middlewares/csvFileDownload');
const ScienceFair = require('../models/Science_fair');

exports.getAllStudent = async (req, res) => {
    try {
        const option = { ...req.body };
        if (!option.hasOwnProperty('query')) {
            option['query'] = {};
        }
        option.query['isDeleted'] = false;
        if (req.loginUserRole === 2) {
            option.query['schoolId'] = req.schoolId;
        }
        const student = await paginate(option, Student);
        return res.status(200).json(student);
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.convertToCSV = async (req, res) => {
    try {
        const scienceFair = await ScienceFair.findById(req.params.id)
        let data = await Student.find()
            .select('-__v -createdAt -updatedAt -isActive -isDeleted')
            .populate('schoolId', 'name')
            .where('scienceFairId').equals(req.params.id)
            .where('isDeleted').equals(false)

        if (req.loginUserRole === 2) {
            data = await Student.find()
                .select('-__v -createdAt -updatedAt -isActive -isDeleted')
                .populate('schoolId', 'name')
                .where('scienceFairId').equals(req.params.id)
                .where('schoolId').equals(req.schoolId)
                .where('isDeleted').equals(false)
        }

        if (!data) {
            return res.status(400).json({ data: err.message })
        }
        let csvData = []

        if (data.length === 0) {
            return res.status(400).json({ message: 'Cannot download the empty file!!' })
        }
        data.forEach(element => {
            csvData.push({
                "Student Id": element._id.toString(), "Student's firstname": element.firstName, "Student's lastname": element.lastName,
                "School Name": element.schoolId.name || "-", "Grade": element.grade
            })
        });

        const fileNM = scienceFair.name.replace(/\s/g, '_') + "_" + '_StudentList'
        await csvFileDownload.convertIntoCSV(csvData, fileNM)
        return res.status(200).json({ fileName: `${fileNM}.csv` })

    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.addStudent = async (req, res) => {
    try {
        const { firstName, lastName, schoolId, scienceFairId, grade } = req.body;
        let school = schoolId
        if (req.loginUserRole === 2) {
            school = req.schoolId
        }
        const newStudent = new Student({ firstName, lastName, schoolId: school, scienceFairId, grade });
        const newStudentObj = await newStudent.save();
        if (!newStudentObj) {
            return res.status(400).json({ message: 'Student Not Added!!' })
        }
        return res.status(200).json({ message: 'Student Added Successfully!!' });
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.updateStudent = async (req, res) => {
    try {
        const check = await Student.findOneAndUpdate({ _id: req.params._id }, req.body)
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `Student Updated Successfully!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getStudentById = async (req, res) => {
    try {
        const data = await Student.findOne({ _id: req.params._id })
            .select('-__v -createdAt -updatedAt')
        if (!data) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ data: data })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.deleteStudent = async (req, res) => {
    try {
        const status = await Student.findOne({ _id: req.params._id })
        if (!status) {
            return res.status(400).json({ message: "This Student is not exist!!" })
        }
        const checkProjects = await Project.find({ $and: [{ students: status._id }, { isDeleted: false }] })
        if (checkProjects.length !== 0) {
            return res.status(400).json({ message: "You cannot delete the student, who is assigned to the project!!!" })
        }
        if (status.isDeleted === true) {
            return res.status(400).json({ message: "This Student is already deleted!!!" })
        }
        const check = await Student.findOneAndUpdate({ _id: req.params._id },
            {
                isActive: false,
                isDeleted: true
            })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `Student Deleted Successfully!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.studentStatusChange = async (req, res) => {
    try {
        let toggle = true
        const status = await Student.findOne({ $and: [{ _id: req.params._id }, { isDeleted: false }] })
        if (status.isActive === true) {
            toggle = false
        }
        const check = await Student.findOneAndUpdate({ _id: req.params._id },
            {
                isActive: toggle
            })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `Student's status changed!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}