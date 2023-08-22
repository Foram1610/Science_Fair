const Category = require('../models/Category')
const paginate = require('../helper/paginate');

exports.addCategory = async (req, res) => {
    try {
        const category = new Category(req.body)
        const check = await category.save()
        if (!check) {
            return res.status(400).json({ message: 'Category Not Added!!' })
        }
        return res.status(200).json({ message: 'Category Added Successfully!!' })
    }
    catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllCategory = async (req, res) => {
    try {
        const category = await paginate(req.body, Category);
        return res.json(category);
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}