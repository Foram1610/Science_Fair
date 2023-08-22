async function categorySeed() {
    const Category = require('../models/Category')
    const categories = require('./category.json')
    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
        const category = categories[categoryIndex];
        await Category.findByIdAndUpdate(category._id, category, { upsert: true })
    }
}

async function strandSeed() {
    const Strand = require('../models/Strand')
    const strands = require('./strand.json')
    for (let strandIndex = 0; strandIndex < strands.length; strandIndex++) {
        const strand = strands[strandIndex];
        await Strand.findByIdAndUpdate(strand._id, strand, { upsert: true })
    }
}

module.exports = { categorySeed, strandSeed }