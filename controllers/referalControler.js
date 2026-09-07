import Referal
from "../models/Referal.js";
const createReferal=async(req,res)=>{
    try
    {
        const newReferal=await Referal.create(req.body)
        res.json(newReferal)
    }
    catch(error)
    {
        res.status(500).json({message:"error in create referal"})
    }
};
const getReferalForPatient=async(req,res)=>{
    const patientId = req.params.patientId
    try {
        const referals=await  Referal.find({patientId:patientId})
        res.json(referals)
    }
    catch(error){
        res.status(500).json({message:"error in ID"})
    }
}
const markReferalAsRead=async(req ,res)=>{
    const referalId=req.params.referalId
    try{
        const markReferal= await Referal.findByIdAndUpdate(referalId,{status:'read'})
        res.json(markReferal)

    }
    catch(error){
        res.status(500).json({message:"error in update referal status"})
    }
}
export {createReferal,getReferalForPatient,markReferalAsRead}
