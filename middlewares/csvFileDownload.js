const path = require('path')
const converter = require('json-2-csv')
const fs = require('fs')

async function convertIntoCSV(jsonArray, filenm) {
    try {
        converter.json2csv(jsonArray, (err, csv) => {
            if (err) throw err.message
            const createFile = path.join(__dirname, "../public/csv", `${filenm}.csv`)
            fs.writeFileSync(createFile, csv)
        })
    } catch (error) {
        throw error.message
    }
}

async function fileDownload(fileName) {
    let csvFilePath = path.join(__dirname, "../public/csv", fileName);
    return csvFilePath
}
module.exports = { convertIntoCSV, fileDownload }