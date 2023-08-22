const mongoose = require('mongoose')
const { PAGINATE_OPTIONS } = require('../util/pagination.constant');
const mongoosePaginate = require('mongoose-paginate-v2');

const StudentSchema = new mongoose.Schema({
    firstName: {
        type: String,
        require: true
    },
    lastName: {
        type: String,
        require: true,
    },
    scienceFairId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScienceFair',
        require : true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        require : true
    },
    grade: {
        type: String,
        enum : [ "K", "1","2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Adult"],
        require : true
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
mongoosePaginate.paginate.options = PAGINATE_OPTIONS;
StudentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Student', StudentSchema, 'Student')