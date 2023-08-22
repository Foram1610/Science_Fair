const mongoose = require('mongoose')
const { PAGINATE_OPTIONS } = require('../util/pagination.constant');
const mongoosePaginate = require('mongoose-paginate-v2');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    strandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strand'
    },
    subStrandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strand'
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    projectCode: {
        type: String
    },
    averageScore: {
        type: Number,
        default: 0,
        min: 0,
    },
    rank: Number,
    evaluationCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    finalEvalCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    scienceFairId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScienceFair'
    },
    judges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
ProjectSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Project', ProjectSchema, 'Project')