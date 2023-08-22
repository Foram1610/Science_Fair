const Strand = require('../models/Strand')
const paginate = require('../helper/paginate');

exports.addStrand = async (req, res) => {
    try {

        const {strandName, parentStrand, categoryId} = req.body
        let parent =  null
        if(parentStrand !== ""){
            parent = parentStrand
        }
        const strand = new Strand({strandName, parentStrand : parent, categoryId})
        const check = await strand.save()
        if (!check) {
            return res.status(400).json({ message: 'Strand Not Added!!' })
        }
        return res.status(200).json({ message: 'Strand Added Successfully!!!' })
    }
    catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllStrand = async (req, res) => {
    try {
        const strand = await paginate(req.body, Strand);
        return res.status(200).json(strand);
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}