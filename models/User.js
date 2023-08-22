const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { PAGINATE_OPTIONS } = require('../util/pagination.constant');
const mongoosePaginate = require('mongoose-paginate-v2');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        require: true
    },
    lastName: {
        type: String,
        require: true
    },
    email: {
        type: String,
        unique: true
    },
    schoolId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'School'
    },
    scienceFairId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'ScienceFair'
    },
    proficient_languages: [Object],
    password: {
        type: String
    },
    avatar: String,
    resetPasswordToken: String,
    expireTokenTime: Date,
    userRole: Number,
    addedBy:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    next();
})
mongoosePaginate.paginate.options = PAGINATE_OPTIONS;
UserSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', UserSchema, 'User')