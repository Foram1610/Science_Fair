const Project = require('../models/Project')
const User = require('../models/User')
const School = require('../models/School')
const Result = require('../models/Result')
const Strand = require('../models/Strand')
const ScienceFair = require('../models/Science_fair')
const dataCheck = require('../util/data.json')
const paginate = require('../helper/paginate')
const csvFileDownload = require('../middlewares/csvFileDownload');

exports.addProject = async (req, res) => {
    try {
        const projectData = { ...req.body }
        const pCode = await Project.find({ $and: [{ scienceFairId: projectData.scienceFairId }, { isDeleted: false }] }).sort({ createdAt: -1 })
        let projectCode, substrand = null
        if (pCode.length === 0) {
            projectCode = "100"
        }
        else {
            let code = pCode[0]
            projectCode = parseInt(code.projectCode) + 1
            const pro = await Project.findOne({ $and: [{ scienceFairId: projectData.scienceFairId }, { isDeleted: false }, { projectCode: projectCode }] })
            if (pro) {
                const pCode1 = await Project.find({ $and: [{ scienceFairId: projectData.scienceFairId }, { isDeleted: false }] }).sort({ updatedAt: -1 })
                let code1 = pCode1[0]
                projectCode = parseInt(code1.projectCode) + 1
            }
        }
        projectData.projectCode = projectCode.toString()
        if (projectData.subStrandId !== "") {
            substrand = projectData.subStrandId
        }
        projectData.substrand = substrand

        let school = projectData.schoolId
        if (req.loginUserRole === 2) {
            school = req.schoolId
        }
        projectData.school = school
        projectData.addedBy = req.loginUserId

        const project = new Project(projectData)
        const check = await project.save()
        if (!check) {
            return res.status(400).json({ message: 'Project Not Added!!!' })
        }
        return res.status(200).json({ message: 'Project Added Successfully!!' })
    }
    catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllProject = async (req, res) => {
    try {
        const option = { ...req.body };
        if (!option.hasOwnProperty('query')) {
            option['query'] = {};
        }
        if (req.loginUserRole === 2) {
            const schoolCheck = await School.findOne({ _id: req.schoolId });
            option.query['schoolId'] = schoolCheck._id;
        }
        if (req.loginUserRole === 3) {
            const judge = await User.findOne({ _id: req.loginUserId });
            option.query['judges'] = { $ne: judge._id }
            option.query['students'] = { $not: { $size: 0 } }
            option.query['averageScore'] = { $in: [0, null] }
            option.query['finalEvalCount'] = { $lt: 3 }
        }
        const project = await paginate(option, Project);

        return res.status(200).json(project);
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.updateProject = async (req, res) => {
    try {
        const projectData = { ...req.body }
        const proj = await Project.findById(req.params._id)
        const pCode = await Project.find({ $and: [{ scienceFairId: proj.scienceFairId }, { projectCode: projectData.projectCode }] })
        if (pCode.length !== 0 && projectCode !== proj.projectCode) {
            return res.status(400).json({ message: 'This project code is already generated for other project!!!' })
        }
        const subId = await Strand.findById(projectData.strandId)
        let sub = null
        if (subId.strandName === dataCheck.STRAND['EURO-SCIENCE']) {
            sub = projectData.subStrandId
        }
        projectData.subStrandId = sub
        const check = await Project.findByIdAndUpdate(req.params._id, projectData)
        if (!check) {
            return res.status(400).json({ message: "Not able to update project!!" })
        }
        return res.status(200).json({ message: `Project Updated Successfully!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.convertToCSV = async (req, res) => {
    try {
        const scienceFair = await ScienceFair.findById(req.params.id)
        let data = await Project.find()
            .select('-__v -createdAt -updatedAt -isActive -isDeleted')
            .populate('schoolId', 'name')
            .populate('strandId', 'strandName')
            .populate('categoryId', 'name')
            .populate('judges', 'firstName')
            .populate('students', 'firstName')
            .where('scienceFairId').equals(req.params.id)
            .where('isDeleted').equals(false)

        if (req.loginUserRole === 2) {
            data = await Project.find()
                .select('-__v -createdAt -updatedAt -isActive -isDeleted')
                .populate('schoolId', 'name')
                .populate('strandId', 'strandName')
                .populate('categoryId', 'name')
                .populate('judges', 'firstName')
                .populate('students', 'firstName')
                .where('scienceFairId').equals(req.params.id)
                .where('schoolId').equals(req.schoolId)
                .where('isDeleted').equals(false)
        }
        if (!data) {
            return res.status(400).json({ data: err.message })
        }
        let csvData = [], stud = "", jud = ""

        if (data.length === 0) {
            return res.status(400).json({ message: 'Cannot download the empty file!!' })
        }
        data.forEach(element => {
            element.students.forEach(element1 => {
                stud = stud + element1._id + '-' + element1.firstName + ","
            });
            element.judges.forEach(element2 => {
                jud = jud + element2._id + '-' + element2.firstName + ","
            });
            csvData.push({
                "Project Code": element.projectCode, "Project Name": element.name, "Description": element.description,
                "Strand": element.strandId.strandName, "Category": element.categoryId.name, "School": element.schoolId.name,
                "Score": element.averageScore || 0, "Rank": element.rank || 0, "Judges": jud || 0, "Students": stud || 0
            })
            stud = ""
            jud = ""
        });

        const fileNM = scienceFair.name.replace(/\s/g, '_') + "_" + '_ProjectList'
        await csvFileDownload.convertIntoCSV(csvData, fileNM)
        return res.status(200).json({ fileName: `${fileNM}.csv` })

    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getProjectById = async (req, res) => {
    try {
        const data = await Project.findOne({ _id: req.params._id })
            .select('-__v -createdAt -updatedAt')
            .populate('strandId', 'strandName')
            .populate('subStrandId', 'strandName')
            .populate('categoryId', 'name')
            .populate('schoolId', 'name')
            .populate('students', 'firstName lastName grade')
            .populate('scienceFairId', 'name')
            .populate('judges', 'firstName lastName scienceFairId')
        if (!data) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ data })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.deleteProject = async (req, res) => {
    try {
        const status = await Project.findById(req.params._id)
        if (!status) {
            return res.status(400).json({ message: "This Project is not exist!!" })
        }
        const checkResult = await Result.find({ $and: [{ projectId: status._id }, { isDeleted: false }] })
        if (checkResult.length !== 0) {
            return res.status(400).json({ message: "You cannot delete the project, which is already been evaluated!!" })
        }
        if (status.isDeleted === true) {
            return res.status(400).json({ message: "Project Already Deleted!!!" })
        }
        const check = await Project.findByIdAndUpdate(req.params._id,
            {
                isActive: false,
                isDeleted: true,
                projectCode: ""
            })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `Project Deleted Successfully!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.projectStatusChange = async (req, res) => {
    try {
        let toggle = true
        const status = await Project.findOne({ $and: [{ _id: req.params._id }, { isDeleted: false }] })
        if (status.isActive === true) {
            toggle = false
        }
        const check = await Project.findByIdAndUpdate(req.params._id, { isActive: toggle })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `Project's Status Changed!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.assignStudent = async (req, res) => {
    try {
        if (req.body.students.length === 0) {
            return res.status(400).json({ message: "Please Select Students for assign them to the Project!!" })
        }
        else {
            const projectCheck = await Project.findByIdAndUpdate(req.params._id, { students: req.body.students })
            if (!projectCheck) {
                return res.status(400).json({ message: 'Not able to assign students to the project!!' })
            }
            return res.status(200).json({ message: 'Assigned Students to the Project!!' })
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}