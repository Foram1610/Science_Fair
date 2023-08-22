const User = require('../models/User')
const Result = require('../models/Result')
const Project = require('../models/Project')
const ScienceFair = require('../models/Science_fair')
const bcrypt = require('bcryptjs');
const datacheck = require('../util/data.json')
const csvFileDownload = require('../middlewares/csvFileDownload');
const paginate = require('../helper/paginate');

exports.addUser = (req, res) => {
    try {
        // console.log('Body Data ==>', req.body)
        const { firstName, lastName, email, userRole, schoolId, scienceFairId, proficient_languages, password } = req.body;
        let avatar;

        if (req.file === undefined) {
            avatar = 'def.png'
        }
        else {
            avatar = req.file.filename;
        }

        User.findOne({ email: email }, async (err, user) => {
            if (user) {
                return res.status(409).json({ message: 'User already exits!!' });
            }

            else {
                const userData = new User({
                    firstName, lastName, email, userRole, avatar: avatar, addedBy: req.loginUserId,
                    schoolId, scienceFairId, proficient_languages, password
                })
                const user1 = await userData.save()
                if (!user1) {
                    return res.status(400).json({ data: `User Not Added!!` })
                }

                // const token = jwt.sign({
                //     email: email,
                //     id: user1._id.toString()
                // }, process.env.SECRET_KEY, { expiresIn: '5m' });


                // await User.findOneAndUpdate({ email: email },
                //     {
                //         resetPasswordToken: token,
                //         expireTokenTime: new Date().getTime() + 300 * 1000
                //     })
                // const templateData = {
                //     firstName: firstName,
                //     lastName: lastName,
                //     email: email,
                //     url: req.headers.origin + '/reset-password',
                //     token: token
                // }
                // const template = await ejs.renderFile("views/setPassword.ejs", templateData);

                // const mailOptions = {

                //     from: 'no-reply<fparmar986@gmail.com>',
                //     to: email,
                //     subject: 'Set Your Password',
                //     html: template
                // }
                // await transport.sendMail(mailOptions)

                return res.status(200).json({ message: `User Added Succesfully!!` })
            }
        })

    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.updateUser = async (req, res) => {
    try {
        const img = await User.findOne({ _id: req.params._id })
        const { firstName, lastName, email, proficient_languages, password } = req.body
        let avatar

        if (password) {
            const hashPass = await bcrypt.hash(password, 10)
            await User.findOneAndUpdate({ _id: req.params._id },
                { password: hashPass }
            )
            return res.status(200).json({ message: `User's Password Updated Successfully!!` })
        }

        if (req.file === undefined) {
            avatar = img.avatar
        }
        else {
            avatar = req.file.filename
        }

        // const checkUser = await User.findOne({ email: email })
        // if (checkUser) {
        //     return res.status(400).json({ message: "This email is already exist!!!" })
        // }

        if (email === img.email) {
            await User.findOneAndUpdate({ _id: req.params._id },
                { firstName, lastName, proficient_languages, avatar: avatar }
            )
            return res.status(200).json({ message: `User Updated Successfully!!` })
        }

        const check = await User.findOneAndUpdate({ _id: req.params._id },
            { firstName, lastName, email, proficient_languages, avatar: avatar }
        )
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `User Updated Successfully!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getUserById = async (req, res) => {
    try {
        const data = await User.findOne({ _id: req.params._id })
            .select('-__v -createdAt -updatedAt -password')
        if (!data) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ data: data })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const status = await User.findOne({ _id: req.params._id })
        if (!status) {
            return res.status(400).json({ message: "This User is not exist!!" })
        }

        if (status.userRole === 1) {
            const checkUser = await User.find({ $and: [{ addedBy: status._id }, { isDeleted: false }] })
            if (checkUser.length !== 0) {
                return res.status(400).json({ message: "You cannot delete the admin who added other users!!" })
            }
        }
        if (status.userRole === 3) {
            const checkUser = await Result.find({ userId: status._id })
            if (checkUser.length !== 0) {
                return res.status(400).json({ message: "You cannot delete the judge who evaluated projects!!" })
            }
        }
        if (status.userRole === 2) {
            const checkProject = await Project.find({ addedBy: req.params._id })
            if (checkProject.length !== 0) {
                return res.status(400).json({ message: "You cannot delete the school admin who has assigned projects!!" })
            }
        }

        if (status.isDeleted === true) {
            return res.status(400).json({ message: "This User is already deleted!!!" })
        }
        else {
            // const check = await User.findOneAndUpdate({ _id: req.params._id },
            //     {
            //         isActive: false,
            //         isDeleted: true
            //     })
            // await User.findByIdAndUpdate(req.params._id, { $unset: { email: 1 } })
            const check = await User.findOneAndRemove({ _id: req.params._id })
            if (!check) {
                return res.status(400).json({ data: error.message })
            }
            return res.status(200).json({ message: `User Deleted Successfully!!` })
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.userStatusChange = async (req, res) => {
    try {
        let toggle = true
        const status = await User.findOne({ $and: [{ _id: req.params._id }, { isDeleted: false }] })
        if (status.isActive === true) {
            toggle = false
        }
        const check = await User.findOneAndUpdate({ _id: req.params._id },
            {
                isActive: toggle
            })
        if (!check) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: `User's status changed!!` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllUsers = async (req, res, next) => {
    try {
        const option = { ...req.body };
        if (!option.hasOwnProperty('query')) {
            option['query'] = {};
        }
        option.query['addedBy'] = { $ne: null }

        const users = await paginate(option, User);
        return res.status(200).json(users);
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.convertToCSV = async (req, res) => {
    try {
        const scienceFair = await ScienceFair.findById(req.params.id)
        let data = await User.find()
            .select('-__v -createdAt -updatedAt -isActive -isDeleted')
            .populate('schoolId', 'name')
            .where('addedBy').equals(req.loginUserId)
            .where('isDeleted').equals(false)
            .where('scienceFairId').equals(req.params.id)
        if (!data) {
            return res.status(400).json({ data: err.message })
        }
        let csvData = []

        if (data.length === 0) {
            return res.status(400).json({ message: 'Cannot download the empty file!!' })
        }
        data.forEach(element => {
            let role, sch = "", lang = ""
            if (element.userRole === datacheck.ROLE.ADMIN) {
                role = 'Admin'
            }
            if (element.userRole === datacheck.ROLE['SCHOOL-ADMIN']) {
                role = 'School Admin'
                sch = element.schoolId.name
            }
            if (element.userRole === datacheck.ROLE.JUDGE) {
                role = 'Judge'
                element.proficient_languages.forEach(element1 => {
                    lang = lang + element1.value + ","
                });

            }
            csvData.push({
                "User Id ": element._id.toString(), "User's firstname": element.firstName, "User's lastname": element.lastName,
                "Email": element.email, "User Role": role, "School": sch, "Proficient Languages": lang
            })
        });

        const fileNM = scienceFair.name.replace(/\s/g, '_') + "_" + '_UserList'
        await csvFileDownload.convertIntoCSV(csvData, fileNM)
        return res.status(200).json({ fileName: `${fileNM}.csv` })

    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}