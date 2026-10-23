import Referal
from "../models/Referal.js";
import { User } from "../models/User.model.js";
import Doctor from "../models/Doctor.model.js";
import { sendReferalNotification } from "../services/notification.service.js";
const createReferal = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.currentUser.id });
        if (!doctor) {
            return res.status(403).json({ message: 'לא נמצאה רשומת רופא למשתמש המחובר' });
        }

        const patientUser = await User.findOne({ tz: req.body.patientTz, role: 'patient' });
        if (!patientUser) {
            return res.status(404).json({ message: 'לא נמצא מטופל עם תעודת הזהות הזו' });
        }

        const newReferal = await Referal.create({
            ...req.body,
            doctorId: doctor._id,
            patientId: patientUser._id,
            attachedFile: req.file ? req.file.filename : null
        });
        //{kkkkkkk
        const doctorUser = await User.findById(req.currentUser.id).select('name').catch(() => null);
        sendReferalNotification({
            to: patientUser.email,
            patientName: patientUser.name,
            doctorName: doctorUser?.name,
            kindReferal: newReferal.kindReferal,
            hasAttachment: Boolean(newReferal.attachedFile)
        });
        //}
        res.json(newReferal);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'חסר או לא תקין פרטים' });
        }
        res.status(500).json({ message: 'error in create referal' });
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
        const referals = await Referal.find({ patientId: patientId })
            .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
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
