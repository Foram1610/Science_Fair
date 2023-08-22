const mongoose = require('mongoose')
const { PAGINATE_OPTIONS } = require('../util/pagination.constant');
const mongoosePaginate = require('mongoose-paginate-v2');

const ResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    scienceFairId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScienceFair'
    },
    categoryId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    strandId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strand'
    },
    subStrandId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strand'
    },
    feedback: {
        type: String,
        require: true
    },
    score1: {
        type: Number,
        default: 0
    },
    score2: {
        type: Number,
        default: 0
    },
    score3: {
        type: Number,
        default: 0
    },
    finalScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    status: {
        type: String,
        default: "needs_approval",
        enum: ["needs_approval", "approved", "rejected"]
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
ResultSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Result', ResultSchema, 'Result')