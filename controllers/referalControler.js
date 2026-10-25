import Referal from "../models/Referal.js";
import { User } from "../models/User.model.js";
import Doctor from "../models/Doctor.model.js";
import { AppError } from "../utils/AppError.js";
import { sendReferalNotification } from "../services/notification.service.js";



const createReferal = async (req, res) => {
 
        const doctor = await Doctor.findOne({ userId: req.currentUser.id }).populate('userId', 'name');
        if (!doctor) {
            throw new AppError('לא נמצאה רשומת רופא למשתמש המחובר', 403, 'auth error')
        }

        const patientUser = await User.findOne({ tz: req.body.patientTz, role: 'patient' });
        if (!patientUser) {
            throw new AppError('לא נמצא מטופל עם תעודת הזהות הזו', 404, 'not found');
        }

        const newReferal = await Referal.create({
            ...req.body,
            doctorId: doctor._id,
            patientId: patientUser._id,
            attachedFile: req.file ? req.file.filename : null
        });
     

        // המייל לא מעכב את התשובה, וכישלון בשליחה לא מפיל את יצירת ההפניה
        //שליחה לפונקציה
        sendReferalNotification({
            to: patientUser.email,
            patientName: patientUser.name,
            doctorName: doctor.userId?.name,
            kindReferal: newReferal.kindReferal,
            hasAttachment: Boolean(newReferal.attachedFile)
        }).catch((error) => console.error('שליחת מייל הפניה נכשלה:', error.message));

        res.json(newReferal);
    };
/**
 * 
 הפונקציה מנסה ליצור הפניה כך שקובץ הוא לא חובה 
 ומחזירה כתגובה את ההפניה החדשה שנוצרה.
 אם הוא לא מצליח ליצור הפניה חדשה
 אם הוא נפל בשגיאה של פרטים מחזיר סטטוס 400
 אחרת סטטוס 500 שזה שרת
 */
const getReferalForPatient = async (req, res) => {
    const patientId = req.params.id
    
        if (req.currentUser.role === 'patient' && String(req.currentUser.id) !== String(patientId)) {
            throw new AppError('אין הרשאה לראות הפניות של משתמש אחר', 403, 'auth error');
        }
        const referals = await Referal.find({  patientId })
            .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        res.json(referals)
  
}
/**
 הפונקציה מחזירה לפציינט את ההפניות שלו על ידי התחברות למונוגו 
 ששם היא מחפשת לפי ID של מוטופל 
 ומחזירה כתגבה את כל ההפניות
 אם הוא נפל בשגיאה מוזר 50 שזה שגיאת שרת
 */
const markReferalAsRead=async(req ,res)=>{
    
  //* מסמנת שההפניה נקראה.רק המטופל / ת שההפניה שלהם יכולים לסמן אותה.
        const referal= await Referal.findById(req.params.referalId);
        if(!referal){
            throw new AppError('ההפניה לא נמצאה', 404, 'not found');

    }
    if(String(referal.patientId)!==String(req.currentUser.id))
        {

        throw new AppError('אין הרשאה לעדכן הפניה של משתמש אחר', 403, 'auth error');
    }
    referal.status = 'read';
    await referal.save();
    res.json(referal);
}
/**
 * הפונקציה מסמנת שההפניה נקראת 
 * מתחברת למונוגו ומחפש שם לפי ID ומעדכנתאת השדה של סטטוס להיות נקרא
 * 
 */
export {createReferal,getReferalForPatient,markReferalAsRead}
