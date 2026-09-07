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
const getReferalForPatient=()=>{}
const markReferalAsRead=()=>{}
