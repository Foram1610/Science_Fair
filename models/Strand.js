const mongoose = require('mongoose')
const { PAGINATE_OPTIONS } = require('../util/pagination.constant');
const mongoosePaginate = require('mongoose-paginate-v2');

const StrandSchema = new mongoose.Schema({
    strandName: {
        type: String,
        require: true
    },
    parentStrand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strand'
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
StrandSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Strand', StrandSchema, 'Strand')