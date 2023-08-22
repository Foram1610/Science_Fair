const mongoose = require('mongoose')
const { PAGINATE_OPTIONS } = require('../util/pagination.constant');
const mongoosePaginate = require('mongoose-paginate-v2');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    description: {
        type: String,
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
CategorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Category', CategorySchema, 'Category')