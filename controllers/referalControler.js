import Referal
from "../models/Referal.js";
const createReferal=async(req,res)=>{
    console.log(req.body);
    try
    {
        const newReferal = await Referal.create({ ...req.body, attachedFile: req.file?req.file.filename:null})
        res.json(newReferal)
        
    }
    catch(error)
    {
        if(error.name==='validationError'){
            return res.status(400).json({message: 'חסר או לא תקין פרטים'})
        }
        res.status(500).json({message:"error in create referal"})
    }
};
/**
 * 
 הפונקציה מנסה ליצור הפניה כך שקובץ הוא לא חובה 
 ומחזירה כתגובה את ההפניה החדשה שנוצרה.
 אם הוא לא מצליח ליצור הפניה חדשה
 אם הוא נפל בשגיאה של פרטים מחזיר סטטוס 400
 אחרת סטטוס 500 שזה שרת
 */
const getReferalForPatient=async(req,res)=>{
    const patientId = req.params.id
    try {
        const referals=await  Referal.find({patientId:patientId})
        res.json(referals)
    }
    catch(error){
        res.status(500).json({message:"error in ID"})
    }
}
/**
 הפונקציה מחזירה לפציינט את ההפניות שלו על ידי התחברות למונוגו 
 ששם היא מחפשת לפי ID של מוטופל 
 ומחזירה כתגבה את כל ההפניות
 אם הוא נפל בשגיאה מוזר 50 שזה שגיאת שרת
 */
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
/**
 * הפונקציה מסמנת שההפניה נקראת 
 * מתחברת למונוגו ומחפש שם לפי ID ומעדכנתאת השדה של סטטוס להיות נקרא
 * 
 */
export {createReferal,getReferalForPatient,markReferalAsRead}
