const Project = require('../models/Project')
const Result = require('../models/Result')
const paginate = require('../helper/paginate');
const statusCheck = require('../util/data.json');
const Strand = require('../models/Strand');
const Category = require('../models/Category');
const dataCheck = require('../util/data.json')
const ScienceFair = require('../models/Science_fair')
const csvFileDownload = require('../middlewares/csvFileDownload')


// exports.addScore = async (req, res) => {
//     try {
//         const { scienceFairId, projectId, score1, score2, score3, feedback } = req.body
//         const checkCount = await Project.findById(projectId)

//         const strand = await Strand.findById(checkCount.strandId)
//         if (!checkCount) {
//             return res.status(400).json({ message: "Project Not Found!!" })
//         }
//         else {
//             if (checkCount.evaluationCount >= 3) {
//                 return res.status(400).json({ message: "This project already evaluated by 3 judges, so you can not evaluate this form at this moment!!" })
//             }

//             let total, result, judgesList = [], totCount = checkCount.evaluationCount + 1
//             judgesList = checkCount.judges
//             judgesList.push(req.loginUserId)
//             if (strand.strandName === dataCheck.STRAND['INDIGENOUS-WAYS']) {
//                 total = score3
//                 result = new Result({ scienceFairId, userId: req.loginUserId, projectId, score3, finalScore: total, feedback })
//                 await Project.findByIdAndUpdate(projectId, { evaluationCount: totCount, judges: judgesList })
//             }
//             else {
//                 total = (score1 * 5) + (score2 * 5) + score3
//                 result = new Result({ scienceFairId, userId: req.loginUserId, projectId, score1: (score1 * 5), score2: (score2 * 5), score3, finalScore: total, feedback })
//                 await Project.findByIdAndUpdate(projectId, { evaluationCount: totCount, judges: judgesList })
//             }
//             const check = await result.save()

//             if (!check) {
//                 return res.status(400).json({ message: "Something went wrong!! Not able to add the data!" })
//             }

//             // let avg = 0, finalScore1
//             // if (totCount === 3 && checkCount.finalEvalCount === 3) {
//             //     const result = await Result.find({ $and: [{ projectId: projectId }, { status: 'approved' }] })
//             //     result.forEach(res1 => {
//             //         avg = avg + res1.finalScore
//             //     });
//             //     finalScore1 = avg / totCount

//             //     await Project.findByIdAndUpdate(projectId, { averageScore: Math.round(finalScore1) })
//             // }

//             return res.status(200).json({ message: "Evaluation is added and waiting for an admin to approve it!!" })
//         }
//     } catch (error) {
//         return res.status(400).json({ message: error.message })
//     }
// }

exports.addScore = async (req, res) => {
    try {
        const resultData = { ...req.body }
        const checkCount = await Project.findById(resultData.projectId)
        if (!checkCount) {
            return res.status(400).json({ message: "Project Not Found!!" })
        } else {
            const PrevApprovedPendingResults = await Result.find({ $and: [{ projectId: resultData.projectId, status: { $ne: dataCheck.STATUS.REJECTED } }] });
            if (PrevApprovedPendingResults.length >= 3) {
                return res.status(400).json({ message: "This project has been already evaluated by 3 judges, so you can not evaluate at this moment!!" })
            }
            const strand = await Strand.findById(checkCount.strandId)
            let result, judgesList = []
            judgesList = checkCount.judges;
            judgesList.push(req.loginUserId)
            resultData.userId = req.loginUserId
            if (strand.strandName === dataCheck.STRAND['INDIGENOUS-WAYS']) {
                resultData.finalScore = resultData.score3
                // result = new Result({ scienceFairId, userId: req.loginUserId, projectId, score3, finalScore: finalScore, feedback })
            }
            else {
                resultData.score1 = (resultData.score1 * 5)
                resultData.score2 = (resultData.score2 * 5)
                resultData.score3 = resultData.score3
                resultData.finalScore = (score1 * 5) + (score2 * 5) + score3;
                // result = new Result({ scienceFairId, userId: req.loginUserId, projectId, score1: (score1 * 5), score2: (score2 * 5), score3, finalScore: finalScore, feedback })

            }
            const check = await result.create(resultData);
            const ApprovedPendingResults = await Result.find({ $and: [{ projectId: resultData.projectId, status: { $ne: dataCheck.STATUS.REJECTED } }] });
            await Project.findByIdAndUpdate(resultData.projectId, { finalEvalCount: ApprovedPendingResults.length, judges: judgesList });

            if (!check) {
                return res.status(400).json({ message: "Something went wrong!! Not able to add the data!" })
            }
            return res.status(200).json({ message: "Evaluation is added and waiting for an admin to approve it!!" })
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllResults = async (req, res) => {
    try {
        const option = { ...req.body };
        if (!option.hasOwnProperty('query')) {
            option['query'] = {};
        }
        if (req.loginUserRole === 2) {
            const schoolCheck = await School.findOne({ _id: req.schoolId });
            option.query['scienceFairId'] = schoolCheck.scienceFairId;
        }
        const result = await paginate(option, Result);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.convertToCSV = async (req, res) => {
    try {
        const scienceFair = await ScienceFair.findById(req.params.id)
        let data = []
        if (req.loginUserRole === 2) {
            const schoolCheck = await School.findOne({ _id: req.schoolId });
            data = await Result.find()
                .select('-__v -createdAt -updatedAt -isActive -isDeleted')
                .where('isDeleted').equals(false)
                .where('scienceFairId').equals(schoolCheck.scienceFairId)
                .populate('projectId', 'name')
                .populate('categoryId', 'name')
                .populate('strandId', 'strandName')
                .populate('userId', 'firstName lastName')
        }
        data = await Result.find()
            .select('-__v -createdAt -updatedAt -isActive -isDeleted')
            .where('isDeleted').equals(false)
            .where('scienceFairId').equals(req.params.id)
            .populate('projectId', 'name projectCode')
            .populate('userId', 'firstName lastName')

        if (!data) {
            return res.status(400).json({ data: err.message })
        }
        let csvData = []

        if (data.length === 0) {
            return res.status(400).json({ message: 'Cannot download the empty file!!' })
        }
        data.forEach(element => {
            let judgeNm = element.userId.firstName + ' ' + element.userId.lastName
            csvData.push({
                "Project Code": element.projectId.projectCode, "Project Name": element.projectId.name,
                "Judge_ID": element.userId._id.toString(), "Judge Name": judgeNm,
                "Feedback": element.feedback || "", "Score1": element.score1, "Score2": element.score2,
                "Score3": element.score3, "Total Score": element.finalScore, "Status": element.status
            })
            judgeNm = ""
        });

        const fileNM = scienceFair.name.replace(/\s/g, '_') + "_" + '_Raw-ResultList'
        await csvFileDownload.convertIntoCSV(csvData, fileNM)
        return res.status(200).json({ fileName: `${fileNM}.csv` })

    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

// exports.feedbackApproval = async (req, res) => {
//     try {
//         const { projectId, status } = req.body
//         const project = await Project.findById(projectId);
//         let judge = [];
//         const checkRes = await Result.find({ $and: [{ projectId: projectId }, { status: dataCheck.STATUS.APPROVED }] })
//         const result = await Result.findById(req.params._id)
//         if (status === dataCheck.STATUS.APPROVED) {
//             if (checkRes.length < 3) {
//                 if (result.status === dataCheck.STATUS.REJECTED) {
//                     // if (project.finalEvalCount === 3) {
//                     //     judge = project.judges
//                     //     judge.push(result.userId)
//                     //     await Result.findByIdAndUpdate(req.params._id, { status: dataCheck.STATUS.APPROVED })
//                     //     await averageScoreCal(projectId)
//                     //     return res.status(200).json({ message: `Evaluation Request Approved!!` })
//                     // }
//                     judge = project.judges
//                     judge.push(result.userId)
//                     await Result.findByIdAndUpdate(req.params._id, { status: dataCheck.STATUS.APPROVED })
//                     await Project.findByIdAndUpdate(projectId, { judges: judge, finalEvalCount: checkRes.length })
//                     await averageScoreCal(projectId)
//                     return res.status(200).json({ message: `Evaluation Request Approved!!` })
//                 }
//                 else if (result.status === dataCheck.STATUS.NEEDAPPROVAL) {
//                     const checkRes1 = await Result.find({ $and: [{ projectId: projectId }, { status: { $ne: dataCheck.STATUS.REJECTED } }] })
//                     if (checkRes1.length > 3) {
//                         return res.status(400).json({ message: `You cannot update status now!! 3 Evaluations of this project are approved.` })
//                     }
//                     await Result.findByIdAndUpdate(req.params._id, { status: dataCheck.STATUS.APPROVED })
//                     await averageScoreCal(projectId)
//                     return res.status(200).json({ message: `Evaluation Request Approved!!` })
//                 }
//                 return res.status(200).json({ message: `Evaluation Request is already approved!!` })
//             }
//             else {
//                 return res.status(400).json({ message: "You cannot update status now!! 3 Evaluations of this project are already approved." })
//             }
//         }
//         else if (status === statusCheck.STATUS.REJECTED) {
//             judge = project.judges
//             // console.log('Judge ==>', Judge ==>)
//             let remainJudge = judge.filter(j => j === result.userId)
//             // judge.pop(result.userId)
//             if (result.status === dataCheck.STATUS.APPROVED) {
//                 await Result.findByIdAndUpdate(req.params._id, { status: dataCheck.STATUS.REJECTED })
//                 if (checkRes.length === 3) {
//                     await Project.findByIdAndUpdate(projectId, {
//                         judges: remainJudge,
//                         finalEvalCount: checkRes.length - 1, rank: 0, averageScore: 0
//                     })
//                 }
//                 await Project.findByIdAndUpdate(projectId, { finalEvalCount: checkRes.length - 1 })
//                 return res.status(200).json({ message: `Evaluation Request Rejected!!` })
//             }
//             else if (result.status === dataCheck.STATUS.NEEDAPPROVAL) {
//                 const checkRes1 = await Result.find({ $and: [{ projectId: projectId }, { status: dataCheck.STATUS.APPROVED }] })
//                 if (checkRes1.length === 3) {
//                     return res.status(400).json({ message: `You cannot update status now!! 3 Evaluations of this project are approved.` })
//                 }
//                 await Result.findByIdAndUpdate(req.params._id, { status: dataCheck.STATUS.REJECTED })
//                 await Project.findByIdAndUpdate(projectId, { judges: remainJudge })
//                 return res.status(200).json({ message: `Evaluation Request Rejected!!` })
//             }
//             return res.status(200).json({ message: "Evaluation Request is already rejected!!" })
//         }
//         else {
//             if (result.status === dataCheck.STATUS.APPROVED) {
//                 if (checkRes.length === 3) {
//                     await Result.findByIdAndUpdate(req.params._id, { status: dataCheck.STATUS.NEEDAPPROVAL })
//                     await Project.findByIdAndUpdate(projectId, { rank: 0, averageScore: 0, finalEvalCount: checkRes.length - 1 })
//                     return res.status(200).json({ message: `Evaluation Request is in pending list!!` })
//                 }
//                 await Result.findByIdAndUpdate(req.params._id, { status: dataCheck.STATUS.NEEDAPPROVAL })
//                 await Project.findByIdAndUpdate(projectId, { finalEvalCount: checkRes.length - 1 })
//                 return res.status(200).json({ message: `Evaluation Request is in pending list!!` })
//             }
//             else if (result.status === dataCheck.STATUS.REJECTED) {
//                 if (checkRes.length === 3) {
//                     return res.status(400).json({ message: `You cannot update status now!! 3 Evaluations of this project are approved.` })
//                 }
//                 judge = project.judges
//                 judge.push(result.userId)
//                 await Result.findByIdAndUpdate(req.params._id, { status: dataCheck.STATUS.NEEDAPPROVAL })
//                 await Project.findByIdAndUpdate(projectId, { judges: judge })
//                 return res.status(200).json({ message: `Evaluation Request is in pending list!!` })
//             }
//             return res.status(200).json({ message: `Evaluation Request is already in pending list!!` })
//         }
//     } catch (error) {
//         return res.status(400).json({ message: error.message })
//     }
// }

exports.feedbackUpdate = async (req, res) => {
    try {
        const feedbackData = { ...req.body };
        const possibleStatus = Object.values(dataCheck.STATUS);
        let message = 'Evaluation Request Approved!!'
        if (possibleStatus.indexOf(feedbackData.status) > -1) {
            const project = await Project.findById(feedbackData.projectId);
            let judgesList = project.judges
            const existingApprovedResults = await Result.find({ $and: [{ projectId: feedbackData.projectId }, { status: dataCheck.STATUS.APPROVED }] });
            const oldResultObj = await Result.findById(req.params._id);
            if (feedbackData.status === dataCheck.STATUS.APPROVED) {
                if (existingApprovedResults.length < 3) {
                    if (judgesList.indexOf(oldResultObj.userId) === -1) {
                        judgesList.push(oldResultObj.userId);
                    }
                } else {
                    return res.status(400).json({ message: "Sorry!! This result could not be approved as 3 results are already approved." })
                }
            } else if (feedbackData.status === statusCheck.STATUS.REJECTED) {
                let remainignJudges = judgesList.filter(j => j.toString() !== oldResultObj.userId.toString());
                judgesList = remainignJudges;
                message = 'Evaluation Request Rejected!!'
            } else {
                if (judgesList.indexOf(oldResultObj.userId) === -1) {
                    judgesList.push(oldResultObj.userId);
                }
                message = 'Evaluation Request Needs Approval!!'
            }
            await Result.findByIdAndUpdate(req.params._id, { status: feedbackData.status });
            const ApprovedPendingResults = await Result.find({ $and: [{ projectId: feedbackData.projectId, status: { $ne: dataCheck.STATUS.REJECTED } }] });
            const ApprovedResults = await Result.find({ $and: [{ projectId: feedbackData.projectId, status: dataCheck.STATUS.APPROVED }] });
            const projectUpdateObj = { finalEvalCount: ApprovedPendingResults.length, judges: judgesList };
            if (ApprovedResults.length === 3) {
                await averageScoreCal(feedbackData.projectId);
            } else {
                projectUpdateObj['rank'] = 0;
                projectUpdateObj['averageScore'] = 0;
            }
            await Project.findByIdAndUpdate(feedbackData.projectId, projectUpdateObj);
            return res.status(200).json({ message: message })
        } else {
            return res.status(400).json({ message: "Please pass valid status!!" })
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

// exports.feedbackApproval = async (req, res) => {
//     try {
//         const { projectId, status } = req.body
//         const project = await Project.findById(projectId)
//         let judge = [], totCount = project.evaluationCount - 1
//         if (status === statusCheck.STATUS.REJECTED) {
//             const res1 = await Result.findByIdAndUpdate(req.params._id, { status: status, isActive: false })
//             judge = project.judges
//             judge.pop(res1.userId)
//             const result1 = await Result.findById(req.params._id)
//             if (project.evaluationCount !== 3 && project.finalEvalCount !== 3 && result1.status === statusCheck.STATUS.APPROVED) {
//                 await Project.findByIdAndUpdate(projectId, { finalEvalCount: project.finalEvalCount - 1 })
//             }
//             if (project.evaluationCount === 3 && project.finalEvalCount === 3 && result1.status === statusCheck.STATUS.APPROVED) {
//                 const findRes = await Result.findOne({ $and: [{ projectId: projectId }, { status: dataCheck.STATUS.NEEDAPPROVAL }] })
//                 if (findRes) {
//                     const jd1 = judge
//                     jd1.push(findRes.userId)
//                     await Project.findByIdAndUpdate(projectId, {
//                         averageScore: 0, evaluationCount: totCount,
//                         finalEvalCount: project.finalEvalCount - 1, rank: 0, judges: judge
//                     })
//                     const pg = await Project.findById(projectId)
//                     await Project.findByIdAndUpdate(pg._id, { judges: jd1, evaluationCount: pg.evaluationCount + 1 })
//                 }
//                 await Project.findByIdAndUpdate(projectId, {
//                     averageScore: 0, evaluationCount: totCount,
//                     finalEvalCount: project.finalEvalCount - 1, rank: 0, judges: judge
//                 })
//                 return res.status(200).json({ message: "Evaluation Request Rejected!!" })
//             }
//             await Project.findByIdAndUpdate(projectId, { evaluationCount: totCount, judges: judge })
//             return res.status(200).json({ message: "Evaluation Request Rejected!!" })
//         }
//         if (status === dataCheck.STATUS.APPROVED) {
//             if (project.finalEvalCount < 3) {
//                 const Judge = await Result.findById(req.params._id)
//                 judge = project.judges
//                 judge.push(Judge.userId)
//                 if (Judge.status === statusCheck.STATUS.REJECTED) {
//                     const checkProject = await Project.findById(projectId)
//                     if (checkProject.evaluationCount === 3 && checkProject.finalEvalCount < 3) {
//                         const resultCheck = await Result.findOne({ $and: [{ projectId: projectId }, { status: dataCheck.STATUS.NEEDAPPROVAL }] })
//                         let jd = checkProject.judges
//                         jd.pop(resultCheck.userId)
//                         await Project.findByIdAndUpdate(projectId, { judges: jd })
//                         const pg1 = await Project.findById(projectId)
//                         await Project.findByIdAndUpdate(pg1._id, { judges: judge })
//                     }
//                     await Project.findByIdAndUpdate(projectId, {
//                         evaluationCount: project.evaluationCount + 1, judges: judge
//                     })
//                 }
//                 await Project.findByIdAndUpdate(projectId, { finalEvalCount: project.finalEvalCount + 1 })
//                 const prj = await Project.findById(projectId)
//                 await Result.findByIdAndUpdate(req.params._id, { status: status })
//                 if (prj.finalEvalCount === 3) {
//                     let avg = 0, finalScore1
//                     const result = await Result.find({ $and: [{ projectId: prj._id }, { status: dataCheck.STATUS.APPROVED }] })
//                     result.forEach(res1 => {
//                         avg = avg + res1.finalScore
//                     });
//                     finalScore1 = avg / prj.evaluationCount
//                     await Project.findByIdAndUpdate(projectId, { averageScore: Math.round(finalScore1) })
//                 }
//                 await projectData(project.scienceFairId, project.categoryId, project.strandId)
//                 return res.status(200).json({ message: `Evaluation Request Approved!!` })

//             }
//             else {
//                 return res.status(400).json({ message: "You cannot update status now!! 3 Evaluations of this project are already approved." })
//             }

//         }
//         else {
//             const projectRes = await Result.findById(req.params._id)

//             if (projectRes.status === statusCheck.STATUS.APPROVED) {
//                 await Project.findByIdAndUpdate(projectId, { finalEvalCount: project.finalEvalCount - 1, averageScore: 0, rank: 0 })
//             }
//             if (projectRes.status === statusCheck.STATUS.REJECTED) {
//                 let judge = []
//                 judge = project.judges
//                 judge.push(projectRes.userId)
//                 await Project.findByIdAndUpdate(projectId, { evaluationCount: project.evaluationCount + 1, judges: judge })
//             }

//             await Result.findByIdAndUpdate(req.params._id, { status: status })
//             return res.status(200).json({ message: `Evaluation Request Needs Approval!!` })

//         }
//     } catch (error) {
//         return res.status(400).json({ message: error.message })
//     }
// }

exports.getResultById = async (req, res) => {
    try {
        const data = await Result.findOne({ _id: req.params._id })
            .select('-__v -createdAt -updatedAt -password')
        if (!data) {
            return res.status(400).json({ data: "Data not fount for this ID!!!" })
        }
        return res.status(200).json({ data: data })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

async function averageScoreCal(id) {
    const countResults = await Project.findById(id)
    const resCount = await Result.find({ $and: [{ projectId: id }, { status: dataCheck.STATUS.APPROVED }] })
    if (resCount.length === 3) {
        let avg = 0, avgScore, judgeList = []
        resCount.forEach(judge => {
            judgeList.push(judge)
        });
        const result = await Result.find({ $and: [{ projectId: countResults._id }, { status: dataCheck.STATUS.APPROVED }] })
        result.forEach(res1 => {
            avg = avg + res1.finalScore
        });

        avgScore = avg / resCount.length
        await Project.findByIdAndUpdate(id, { averageScore: Math.round(avgScore), judges: judgeList })
        await projectData(countResults.scienceFairId, countResults.categoryId, countResults.strandId)
    }
}

async function projectData(scienceFairId, catId, strId) {
    const data = await Project.find(
        {
            $and: [
                { scienceFairId: scienceFairId },
                { averageScore: { $ne: 0 } },
                { averageScore: { $ne: null } },
                { categoryId: catId },
                { strandId: strId },
                { isDeleted: false },
            ]
        }
    )
        .sort({ averageScore: -1 })
        .populate('categoryId', 'name')
        .populate('students', 'firstName lastName')
        .select('-isActive -isDeleted -createdAt -updatedAt -__v')

    for (let i = 0; i < data.length; i++) {
        if (data[i]) {
            await Project.findOneAndUpdate({ _id: data[i]._id }, { rank: 0 })
        }
    }
    if (data.length === 1) {
        await Project.findByIdAndUpdate(data[0]._id, { rank: 1 })
    }
    else {
        for (i = 0, j = 1; i < data.length, j < data.length; i++) {
            if (data[i + 1]) {
                if (data[i].averageScore === data[i + 1].averageScore) {
                    await Project.findByIdAndUpdate(data[i]._id, { rank: j })
                    await Project.findByIdAndUpdate(data[i + 1]._id, { rank: j })
                }
                else {
                    if (j < data.length) {
                        await Project.findByIdAndUpdate(data[i]._id, { rank: j })
                        j++
                        await Project.findByIdAndUpdate(data[i + 1]._id, { rank: j })
                    }
                    else if (j === data.length) {
                        break;
                    }
                }
            }
            else {
                j = data.length + 1
                i = data.length + 1
            }
        }
    }

    const data1 = await Project.find(
        {
            $and: [
                { scienceFairId: scienceFairId },
                { averageScore: { $ne: 0 } },
                { averageScore: { $ne: null } },
                { categoryId: catId },
                { strandId: strId },
                { rank: { $gt: 0 } },
                { isDeleted: false }
            ]
        }
    )
        .sort({ averageScore: -1 })
        .populate('categoryId', 'name')
        .populate('scienceFairId', 'name')
        .populate('schoolId', 'name schoolCode')
        .populate('students', 'firstName lastName')
        .populate('judges', 'firstName lastName')
        .select('-isActive -isDeleted -createdAt -updatedAt -__v')

    return data1
}

async function allProjectData(scienceFairId, catId, strId) {
    const data = await Project.find(
        {
            $and: [
                { scienceFairId: scienceFairId },
                { averageScore: { $ne: 0 } },
                { averageScore: { $ne: null } },
                { categoryId: catId },
                { strandId: strId },
                { isDeleted: false },
            ]
        }
    )
        .sort({ averageScore: -1 })
        .populate('categoryId', 'name')
        .populate('scienceFairId', 'name')
        .populate('schoolId', 'name schoolCode')
        .populate('students', 'firstName lastName')
        .populate('judges', 'firstName lastName')
        .select('-isActive -isDeleted -createdAt -updatedAt -__v')

    return data
}

exports.getAllScore = async (req, res) => {
    try {
        const { scienceFairId } = req.body
        const IndigenousStrand = await Strand.findOne({ strandName: dataCheck.STRAND['INDIGENOUS-WAYS'] })
        const EuroScienceStrand = await Strand.findOne({ strandName: dataCheck.STRAND['EURO-SCIENCE'] })
        const Youth = await Category.findOne({ name: dataCheck.CATEGORY.YOUTH })
        const Junior = await Category.findOne({ name: dataCheck.CATEGORY.JUNIOR })
        const Senior = await Category.findOne({ name: dataCheck.CATEGORY.SENIOR })
        const Intermediate = await Category.findOne({ name: dataCheck.CATEGORY.INTERMEDIATE })

        const indigenousYouthProject = await allProjectData(scienceFairId, Youth._id, IndigenousStrand._id)

        const euroScienceYouthProject = await allProjectData(scienceFairId, Youth._id, EuroScienceStrand._id)

        const indigenousJuniorProject = await allProjectData(scienceFairId, Junior._id, IndigenousStrand._id)

        const euroScienceJuniorProject = await allProjectData(scienceFairId, Junior._id, EuroScienceStrand._id)

        const indigenousSeniorProject = await allProjectData(scienceFairId, Senior._id, IndigenousStrand._id)

        const euroScienceSeniorProject = await allProjectData(scienceFairId, Senior._id, EuroScienceStrand._id)

        const indigenousIntermediateProject = await allProjectData(scienceFairId, Intermediate._id, IndigenousStrand._id)

        const euroScienceIntermediateProject = await allProjectData(scienceFairId, Intermediate._id, EuroScienceStrand._id)


        const TopScores = {
            Youth: { indigenousYouthProject, euroScienceYouthProject },
            Junior: { indigenousJuniorProject, euroScienceJuniorProject },
            Senior: { indigenousSeniorProject, euroScienceSeniorProject },
            Intermediate: { indigenousIntermediateProject, euroScienceIntermediateProject }
        }
        return res.status(200).json(TopScores)
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllProjects = async (req, res) => {
    try {
        const option = { ...req.body };
        if (!option.hasOwnProperty('query')) {
            option['query'] = {};
        }
        option.query['averageScore'] = { $ne: 0 }
        option.query['rank'] = { $ne: 0 }
        option.query['averageScore'] = { $ne: null }
        // option.query['rank'] = { $ne: null }
        const project = await paginate(option, Project);

        return res.status(200).json(project);
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getTopScore = async (req, res) => {
    try {

        const { scienceFairId } = req.body
        const IndigenousStrand = await Strand.findOne({ strandName: dataCheck.STRAND['INDIGENOUS-WAYS'] })
        const EuroScienceStrand = await Strand.findOne({ strandName: dataCheck.STRAND['EURO-SCIENCE'] })
        const Youth = await Category.findOne({ name: dataCheck.CATEGORY.YOUTH })
        const Junior = await Category.findOne({ name: dataCheck.CATEGORY.JUNIOR })
        const Senior = await Category.findOne({ name: dataCheck.CATEGORY.SENIOR })
        const Intermediate = await Category.findOne({ name: dataCheck.CATEGORY.INTERMEDIATE })

        const indigenousYouthProject = await projectData(scienceFairId, Youth._id, IndigenousStrand._id)

        const euroScienceYouthProject = await projectData(scienceFairId, Youth._id, EuroScienceStrand._id)

        const indigenousJuniorProject = await projectData(scienceFairId, Junior._id, IndigenousStrand._id)

        const euroScienceJuniorProject = await projectData(scienceFairId, Junior._id, EuroScienceStrand._id)

        const indigenousSeniorProject = await projectData(scienceFairId, Senior._id, IndigenousStrand._id)

        const euroScienceSeniorProject = await projectData(scienceFairId, Senior._id, EuroScienceStrand._id)

        const indigenousIntermediateProject = await projectData(scienceFairId, Intermediate._id, IndigenousStrand._id)

        const euroScienceIntermediateProject = await projectData(scienceFairId, Intermediate._id, EuroScienceStrand._id)


        const TopScores = {
            Youth: { indigenousYouthProject, euroScienceYouthProject },
            Junior: { indigenousJuniorProject, euroScienceJuniorProject },
            Senior: { indigenousSeniorProject, euroScienceSeniorProject },
            Intermediate: { indigenousIntermediateProject, euroScienceIntermediateProject }
        }
        return res.status(200).json(TopScores)
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.ConvertCSVFile = async (req, res) => {
    try {
        const { scienceFairId } = req.body
        const scienceFair = await ScienceFair.findOne({ _id: scienceFairId })

        // let curDate = new Date()
        // let selectedDate = new Date(scienceFair.date)
        // let diffTime = selectedDate - curDate;
        // const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // if (diffDays > 0) {
        //     return res.status(400).json({ message: 'Cannot download the file while evaluation is still in progress!!' })
        // }

        if (scienceFair.isLocked === false) {
            return res.status(400).json({ message: 'Science Fair is still unlocked!! Cannot download the top score file now!!' })
        }
        else {

            const IndigenousStrand = await Strand.findOne({ strandName: dataCheck.STRAND['INDIGENOUS-WAYS'] })
            const EuroScienceStrand = await Strand.findOne({ strandName: dataCheck.STRAND['EURO-SCIENCE'] })
            const Youth = await Category.findOne({ name: dataCheck.CATEGORY.YOUTH })
            const Junior = await Category.findOne({ name: dataCheck.CATEGORY.JUNIOR })
            const Senior = await Category.findOne({ name: dataCheck.CATEGORY.SENIOR })
            const Intermediate = await Category.findOne({ name: dataCheck.CATEGORY.INTERMEDIATE })

            const indigenousYouthProject = await allProjectData(scienceFairId, Youth._id, IndigenousStrand._id)

            const euroScienceYouthProject = await allProjectData(scienceFairId, Youth._id, EuroScienceStrand._id)

            const indigenousJuniorProject = await allProjectData(scienceFairId, Junior._id, IndigenousStrand._id)

            const euroScienceJuniorProject = await allProjectData(scienceFairId, Junior._id, EuroScienceStrand._id)

            const indigenousSeniorProject = await allProjectData(scienceFairId, Senior._id, IndigenousStrand._id)

            const euroScienceSeniorProject = await allProjectData(scienceFairId, Senior._id, EuroScienceStrand._id)

            const indigenousIntermediateProject = await allProjectData(scienceFairId, Intermediate._id, IndigenousStrand._id)

            const euroScienceIntermediateProject = await allProjectData(scienceFairId, Intermediate._id, EuroScienceStrand._id)

            let csvData = [], stud = "", jud = "", studid = "", judid = ""

            if (indigenousYouthProject.length === 0 && euroScienceYouthProject.length === 0 &&
                indigenousJuniorProject.length === 0 && euroScienceJuniorProject.length === 0 &&
                indigenousSeniorProject.length === 0 && euroScienceSeniorProject.length === 0 &&
                indigenousIntermediateProject.length === 0 && euroScienceIntermediateProject.length === 0) {
                return res.status(400).json({ message: 'Cannot download the empty file!!' })
            }
            else {
                if (indigenousYouthProject.length === 0) {
                    csvData.push({
                        "Category": Youth.name, "Strand": IndigenousStrand.strandName,
                        "Project Code": "", "Project Name": "", "Description": "", "School Code": "", "School": "",
                        "Rank": "", "Score": "", "Student_ID": "", "Students": "", "Judges_ID": "", "Judges": ""
                    })
                }
                else {
                    indigenousYouthProject.forEach(project => {
                        project.students.forEach(element1 => {
                            studid = studid + element1._id + ','
                            stud = stud + element1.firstName + ' ' + element1.lastName + ','
                        });
                        project.judges.forEach(element2 => {
                            judid = judid + element2._id + ','
                            jud = jud + element2.firstName + ' ' + element2.lastName + ','
                        });
                        csvData.push({
                            "Category": Youth.name, "Strand": IndigenousStrand.strandName,
                            "Project Code": project.projectCode, "Project Name": project.name, "Description": project.description,
                            "School Code": project.schoolId.schoolCode, "School": project.schoolId.name,
                            "Rank": project.rank || "" || "", "Score": project.averageScore || "" || "",
                            "Student_ID": studid || 0, "Students": stud || 0, "Judges_ID": judid || 0, "Judges": jud || 0
                        })
                        studid = ""
                        judid = ""
                        stud = ""
                        jud = ""
                    });
                }

                if (euroScienceYouthProject.length === 0) {
                    csvData.push({
                        "Category": Youth.name, "Strand": EuroScienceStrand.strandName,
                        "Project Code": "", "Project Name": "", "Description": "", "School Code": "", "School": "",
                        "Rank": "", "Score": "", "Student_ID": "", "Students": "", "Judges_ID": "", "Judges": ""
                    })
                }
                else {
                    euroScienceYouthProject.forEach(project => {
                        project.students.forEach(element1 => {
                            studid = studid + element1._id + ','
                            stud = stud + element1.firstName + ' ' + element1.lastName + ','
                        });
                        project.judges.forEach(element2 => {
                            judid = judid + element2._id + ','
                            jud = jud + element2.firstName + ' ' + element2.lastName + ','
                        });
                        csvData.push({
                            "Category": Youth.name, "Strand": EuroScienceStrand.strandName,
                            "Project Code": project.projectCode, "Project Name": project.name, "Description": project.description,
                            "School Code": project.schoolId.schoolCode, "School": project.schoolId.name,
                            "Rank": project.rank || "", "Score": project.averageScore || "",
                            "Student_ID": studid || 0, "Students": stud || 0, "Judges_ID": judid || 0, "Judges": jud || 0
                        })
                        studid = ""
                        judid = ""
                        stud = ""
                        jud = ""
                    });
                }

                if (indigenousJuniorProject.length === 0) {
                    csvData.push({
                        "Category": Junior.name, "Strand": IndigenousStrand.strandName,
                        "Project Code": "", "Project Name": "", "Description": "", "School Code": "", "School": "",
                        "Rank": "", "Score": "", "Student_ID": "", "Students": "", "Judges_ID": "", "Judges": ""
                    })
                }
                else {
                    indigenousJuniorProject.forEach(project => {
                        project.students.forEach(element1 => {
                            studid = studid + element1._id + ','
                            stud = stud + element1.firstName + ' ' + element1.lastName + ','
                        });
                        project.judges.forEach(element2 => {
                            judid = judid + element2._id + ','
                            jud = jud + element2.firstName + ' ' + element2.lastName + ','
                        });
                        csvData.push({
                            "Category": Junior.name, "Strand": IndigenousStrand.strandName,
                            "Project Code": project.projectCode, "Project Name": project.name, "Description": project.description,
                            "School Code": project.schoolId.schoolCode, "School": project.schoolId.name,
                            "Rank": project.rank || "", "Score": project.averageScore || "",
                            "Student_ID": studid || 0, "Students": stud || 0, "Judges_ID": judid || 0, "Judges": jud || 0
                        })
                        studid = ""
                        judid = ""
                        stud = ""
                        jud = ""
                    });
                }

                if (euroScienceJuniorProject.length === 0) {
                    csvData.push({
                        "Category": Junior.name, "Strand": EuroScienceStrand.strandName,
                        "Project Code": "", "Project Name": "", "Description": "", "School Code": "", "School": "",
                        "Rank": "", "Score": "", "Student_ID": "", "Students": "", "Judges_ID": "", "Judges": ""
                    })
                }
                else {
                    euroScienceJuniorProject.forEach(project => {
                        project.students.forEach(element1 => {
                            studid = studid + element1._id + ','
                            stud = stud + element1.firstName + ' ' + element1.lastName + ','
                        });
                        project.judges.forEach(element2 => {
                            judid = judid + element2._id + ','
                            jud = jud + element2.firstName + ' ' + element2.lastName + ','
                        });
                        csvData.push({
                            "Category": Junior.name, "Strand": EuroScienceStrand.strandName,
                            "Project Code": project.projectCode, "Project Name": project.name, "Description": project.description,
                            "School Code": project.schoolId.schoolCode, "School": project.schoolId.name,
                            "Rank": project.rank || "", "Score": project.averageScore || "",
                            "Student_ID": studid || 0, "Students": stud || 0, "Judges_ID": judid || 0, "Judges": jud || 0
                        })
                        studid = ""
                        judid = ""
                        stud = ""
                        jud = ""
                    });
                }

                if (indigenousSeniorProject.length === 0) {
                    csvData.push({
                        "Category": Senior.name, "Strand": IndigenousStrand.strandName,
                        "Project Code": "", "Project Name": "", "Description": "", "School Code": "", "School": "",
                        "Rank": "", "Score": "", "Student_ID": "", "Students": "", "Judges_ID": "", "Judges": ""
                    })
                }
                else {
                    indigenousSeniorProject.forEach(project => {
                        project.students.forEach(element1 => {
                            studid = studid + element1._id + ','
                            stud = stud + element1.firstName + ' ' + element1.lastName + ','
                        });
                        project.judges.forEach(element2 => {
                            judid = judid + element2._id + ','
                            jud = jud + element2.firstName + ' ' + element2.lastName + ','
                        });
                        csvData.push({
                            "Category": Senior.name, "Strand": IndigenousStrand.strandName,
                            "Project Code": project.projectCode, "Project Name": project.name, "Description": project.description,
                            "School Code": project.schoolId.schoolCode, "School": project.schoolId.name,
                            "Rank": project.rank || "", "Score": project.averageScore || "",
                            "Student_ID": studid || 0, "Students": stud || 0, "Judges_ID": judid || 0, "Judges": jud || 0
                        })
                        studid = ""
                        judid = ""
                        stud = ""
                        jud = ""
                    });
                }

                if (euroScienceSeniorProject.length === 0) {
                    csvData.push({
                        "Category": Senior.name, "Strand": EuroScienceStrand.strandName,
                        "Project Code": "", "Project Name": "", "Description": "", "School Code": "", "School": "",
                        "Rank": "", "Score": "", "Student_ID": "", "Students": "", "Judges_ID": "", "Judges": ""
                    })
                }
                else {
                    euroScienceSeniorProject.forEach(project => {
                        project.students.forEach(element1 => {
                            studid = studid + element1._id + ','
                            stud = stud + element1.firstName + ' ' + element1.lastName + ','
                        });
                        project.judges.forEach(element2 => {
                            judid = judid + element2._id + ','
                            jud = jud + element2.firstName + ' ' + element2.lastName + ','
                        });
                        csvData.push({
                            "Category": Senior.name, "Strand": EuroScienceStrand.strandName,
                            "Project Code": project.projectCode, "Project Name": project.name, "Description": project.description,
                            "School Code": project.schoolId.schoolCode, "School": project.schoolId.name,
                            "Rank": project.rank || "", "Score": project.averageScore || "",
                            "Student_ID": studid || 0, "Students": stud || 0, "Judges_ID": judid || 0, "Judges": jud || 0
                        })
                        studid = ""
                        judid = ""
                        stud = ""
                        jud = ""
                    });
                }

                if (indigenousIntermediateProject.length === 0) {
                    csvData.push({
                        "Category": Intermediate.name, "Strand": IndigenousStrand.strandName,
                        "Project Code": "", "Project Name": "", "Description": "", "School Code": "", "School": "",
                        "Rank": "", "Score": "", "Student_ID": "", "Students": "", "Judges_ID": "", "Judges": ""
                    })
                }
                else {
                    indigenousIntermediateProject.forEach(project => {
                        project.students.forEach(element1 => {
                            studid = studid + element1._id + ','
                            stud = stud + element1.firstName + ' ' + element1.lastName + ','
                        });
                        project.judges.forEach(element2 => {
                            judid = judid + element2._id + ','
                            jud = jud + element2.firstName + ' ' + element2.lastName + ','
                        });
                        csvData.push({
                            "Category": Intermediate.name, "Strand": IndigenousStrand.strandName,
                            "Project Code": project.projectCode, "Project Name": project.name, "Description": project.description,
                            "School Code": project.schoolId.schoolCode, "School": project.schoolId.name,
                            "Rank": project.rank || "", "Score": project.averageScore || "",
                            "Student_ID": studid || 0, "Students": stud || 0, "Judges_ID": judid || 0, "Judges": jud || 0
                        })
                        studid = ""
                        judid = ""
                        stud = ""
                        jud = ""
                    });
                }

                if (euroScienceIntermediateProject.length === 0) {
                    csvData.push({
                        "Category": Intermediate.name, "Strand": EuroScienceStrand.strandName,
                        "Project Code": "", "Project Name": "", "Description": "", "School Code": "", "School": "",
                        "Rank": "", "Score": "", "Student_ID": "", "Students": "", "Judges_ID": "", "Judges": ""
                    })
                }
                else {
                    euroScienceIntermediateProject.forEach(project => {
                        project.students.forEach(element1 => {
                            studid = studid + element1._id + ','
                            stud = stud + element1.firstName + ' ' + element1.lastName + ','
                        });
                        project.judges.forEach(element2 => {
                            judid = judid + element2._id + ','
                            jud = jud + element2.firstName + ' ' + element2.lastName + ','
                        });
                        csvData.push({
                            "Category": Intermediate.name, "Strand": EuroScienceStrand.strandName,
                            "Project Code": project.projectCode, "Project Name": project.name, "Description": project.description,
                            "School Code": project.schoolId.schoolCode, "School": project.schoolId.name,
                            "Rank": project.rank || "", "Score": project.averageScore || "",
                            "Student_ID": studid || 0, "Students": stud || 0, "Judges_ID": judid || 0, "Judges": jud || 0
                        })
                        studid = ""
                        judid = ""
                        stud = ""
                        jud = ""
                    });
                }

                const fileNM = scienceFair.name.replace(/\s/g, '_') + "_" + "Score_List"
                await csvFileDownload.convertIntoCSV(csvData, fileNM)
                return res.status(200).json({ fileName: `${fileNM}.csv` })
            }
            // else {
            //     ArrayOfCategoryStrand.forEach(data => {
            //         if (data.length === 0) {
            //                     csvData.push({
            //                         "Category": Youth.name, "Strand": data.strandName,
            //                          "Project Code": "", "Project Name": "", "Description": "", "School Code": "", "School": "",
            //                         "Rank": "", "Score": "", "Student_ID": "", "Students": "", "Judges_ID": "", "Judges": ""
            //                     })
            //                 }
            //                 else {
            //                     data.forEach(project => {
            //                         project.students.forEach(element1 => {
            //                             studid = studid + element1._id + ','
            //                             stud = stud + element1.firstName + ' ' + element1.lastName + ','
            //                         });
            //                         project.judges.forEach(element2 => {
            //                             judid = judid + element2._id + ','
            //                             jud = jud + element2.firstName + ' ' + element2.lastName + ','
            //                         });
            //                         csvData.push({
            //                             "Category": Youth.name, "Strand": data.strandName,
            //                             "Project Code": project.projectCode, "Project Name": project.name, "Description": project.description,
            //                             "School Code": project.schoolId.schoolCode, "School": project.schoolId.name,
            //                             "Rank": project.rank || "" || "", "Score": project.averageScore || "" || "",
            //                             "Student_ID": studid || 0, "Students": stud || 0, "Judges_ID": judid || 0, "Judges": jud || 0
            //                         })
            //                         studid = ""
            //                         judid = ""
            //                         stud = ""
            //                         jud = ""
            //                     });
            //                 }
            //     });
            // }
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.downloadFiles = async (req, res) => {
    try {
        let csvFile = await csvFileDownload.fileDownload(req.params.fileName)
        res.download(csvFile);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}