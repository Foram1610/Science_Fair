const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User')
const jwt_decode = require('jwt-decode')
// const transport = require('../util/email')
const ejs = require('ejs')

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body
        if (username === "") {
            return res.status(409).json({ message: "Please enter emailID to login!!!" })
        }

        let user = await User.findOne({ $and: [{ email: username }, { isDeleted: false }] })
        if (!user) {
            return res.status(409).json({ message: 'This User is not exits!!' });
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Password!!' });
        }
        const JWTTokenObj = {
            email: user.email,
            _id: user._id.toString(),
            type: user.userRole
        };
        if (user.userRole === 2) {
            JWTTokenObj['schoolId'] = user.schoolId;
        }
        const token = jwt.sign(JWTTokenObj, process.env.SECRET_KEY, { expiresIn: '8h' });
        return res.status(200).json({ message: 'Login Successfully!!', token: token })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.me = async (req, res) => {
    try {
        const data = await User.findOne({ _id: req.loginUserId })
            .select('-__v -createdAt -updatedAt -password')
        return res.status(200).json({ data: data })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

// exports.forgotPassLink = async (req, res) => {
//     try {
//         const { email } = req.body
//         const user = await User.findOne({ email: email })
//         if (!user) {
//             return res.status(400).json({ message: 'This email is not exist!!' })
//         }
//         else {
//             const token = jwt.sign({
//                 email: user.email,
//                 id: user.id.toString()
//             }, process.env.SECRET_KEY, { expiresIn: '5m' });

//             await User.findOneAndUpdate({ email: email },
//                 {
//                     resetPasswordToken: token,
//                     expireTokenTime: new Date().getTime() + 300 * 1000
//                 })

//             const templateData = {

//                 url: req.headers.origin + '/reset-password',
//                 token: token
//             }
//             const template = await ejs.renderFile("views/resetPassword.ejs", templateData);

//             const mailOptions = {
//                 from: 'no-reply<fparmar986@gmail.com>',
//                 to: email,
//                 subject: 'Reset Your Password',
//                 html: template
//             }
//             transport.sendMail(mailOptions)

//             if (!transport) {
//                 return res.status(404).json({ message: 'Not able to sent the email!!' })
//             }
//             return res.status(200).json({ message: 'Mail sent to your Email!!!' })
//         }
//     } catch (error) {
//         return res.status(400).json({ message: error.message })
//     }
// }

// exports.forgotPassword = async (req, res) => {
//     try {
//         const { password, resetPasswordToken } = req.body
//         var decoded = jwt_decode(resetPasswordToken);
//         const user = await User.findOne({ _id: decoded.id })
//         if (!user) {
//             return res.status(400).json({ message: 'User dose not exits!!' })
//         }
//         else {
//             let curTime = new Date().getTime();
//             let extime = (user.expireTokenTime).getTime();
//             let diff = extime - curTime;
//             if (diff < 0) {
//                 return res.status(400).json({ message: 'Link exprired!!, Please send the mail again!!' })
//             }
//             const hash = bcrypt.hashSync(password, 10);
//             const updatePassword = await User.findOneAndUpdate({ _id: user.id }, { password: hash })
//             if (!updatePassword) {
//                 return res.status(400).json({ message: 'Password Not Updated!!' })
//             }

//             await User.findOneAndUpdate({ email: user.email }, { resetPasswordToken: "" })

//             return res.status(200).json({ message: 'Password Updated!!' })
//         }
//     } catch (error) {
//         return res.status(400).json({ message: error.message })
//     }
// }