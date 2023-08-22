const jwt = require('jsonwebtoken')
const User = require('../models/User')

const checkUser = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        if (!authorization && !authorization.startsWith('Bearer')) {
            return res.status(403).json({ message: 'Token expired!!' })
        } else {
            let token = authorization.split(' ')[1]
            const _id = jwt.verify(token, process.env.SECRET_KEY)
            const type = await User.findOne({ _id: _id })
            req.loginUserId = type._id;
            req.loginUserRole = type.userRole;
            if(type.schoolId){
                req.schoolId = type.schoolId;
            }
            next();
        }
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized User!!' })
    }
}

module.exports = checkUser