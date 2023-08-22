const mongoose = require('mongoose')
const { PAGINATE_OPTIONS } = require('../util/pagination.constant');
const mongoosePaginate = require('mongoose-paginate-v2');

const ScienceFairSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        require: true
    },
    location: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    image: String,
    isLocked : {
        type: Boolean,
        default: false
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
ScienceFairSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ScienceFair', ScienceFairSchema, 'ScienceFair')