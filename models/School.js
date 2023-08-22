const mongoose = require('mongoose')
const { PAGINATE_OPTIONS } = require('../util/pagination.constant');
const mongoosePaginate = require('mongoose-paginate-v2');

const SchoolSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    schoolCode: {
        type: String
    },
    scienceFairId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScienceFair'
    },
    location: {
        type: String,
        require: true
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
SchoolSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('School', SchoolSchema, 'School')