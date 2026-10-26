import Referal from "../models/Referal.js";
import { User } from "../models/User.model.js";
import Doctor from "../models/Doctor.model.js";
import { AppError } from "../utils/AppError.js";
import { sendReferalNotification } from "../services/notification.service.js";



/**
 * @fileoverview
 * קונטרולר ההפניות: שלוש פעולות על הפניות
 * 1. יצירת הפניה (רופאה)
 * 2. הצגת ההפניות של מטופלת
 * 3. סימון הפניה כנקראה
 * לפני כל פונקציה רצים שומרים שהוגדרו בקובץ הנתיבים (routes/referalRoutes.js)
 * הם בודקים טוקן, תפקיד, קובץ מצורף ותקינות הנתונים
 * שגיאות נזרקות עם AppError ועוברות לטיפול שגיאות מרכזי
 * Express 5 תופס גם שגיאות של פונקציות אסינכרוניות, ולכן אין כאן try/catch
 */

/**
 * מה היא עושה: יוצרת הפניה חדשה מרופאה למטופלת
 * מוצאת את הרופאה לפי הטוקן, ואת המטופלת לפי תעודת הזהות שהוזנה
 * שומרת את ההפניה, ושולחת למטופלת מייל התראה
 * הקובץ המצורף לא חובה. אם הועלה, נשמר במסד רק שמו
 * למה צריך: הרופאה לא מכירה מזהים של מסד הנתונים, ולכן המטופלת מזוהה לפי תעודת זהות
 * והרופאה מזוהה לפי הטוקן, כך שאי אפשר לשלוח הפניה בשם רופאה אחרת
 * המייל נשלח ברקע בלי await: התשובה לא מחכה לו, וכישלון בשליחה לא מפיל את יצירת ההפניה
 * שגיאות: 403 אם אין רשומת רופאה למשתמשת, 404 אם אין מטופלת עם תעודת הזהות
 * משמשת את POST /api/referals
 *
 * @param {Object} req הבקשה: req.body (patientTz, kindReferal, description), req.file (הקובץ, אם הועלה), req.currentUser (המשתמשת המחוברת)
 * @param {Object} res התשובה: מחזירה את ההפניה שנוצרה
 * @returns {Promise<void>}
 */
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
 * מה היא עושה: מחזירה את ההפניות של מטופלת, עם שם הרופאה שיצרה כל הפניה
 * מטופלת רשאית לראות רק את ההפניות של עצמה: משווים את המזהה בכתובת למזהה שבטוקן, ואם שונה זורקים 403
 * רופאה יכולה לראות הפניות של כל מטופלת
 * populate מחליפה את מזהה הרופאה בשמה, כי בהפניה שמור רק המזהה
 * ההשוואה בין מזהים היא בין טקסטים (String), כי מזהה במסד הוא אובייקט
 * ו-!== על אובייקטים בודק זהות בזיכרון ולא ערך
 * משמשת את GET /api/patients/:id/referals ואת הדף "ההפניות שלי"
 *
 * @param {Object} req הבקשה: req.params.id (מזהה המשתמש של המטופלת), req.currentUser (המשתמשת המחוברת)
 * @param {Object} res התשובה: מערך ההפניות
 * @returns {Promise<void>}
 */
const getReferalForPatient = async (req, res) => {
    const patientId = req.params.id

    if (req.currentUser.role === 'patient' && String(req.currentUser.id) !== String(patientId)) {
        throw new AppError('אין הרשאה לראות הפניות של משתמש אחר', 403, 'auth error');
    }
    const referals = await Referal.find({ patientId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    res.json(referals)

}
/**
 * מה היא עושה: מסמנת הפניה כנקראה (הסטטוס עובר מ-open ל-read)
 * הפניה שלא קיימת: שגיאה 404. הפניה של מטופלת אחרת: שגיאה 403
 * למה צריך: כדי שהמטופלת תראה אילו הפניות חדשות ואילו כבר נקראו
 * משמשת את PUT /api/referals/:referalId. הדף "ההפניות שלי" קורא לה אחרי שהוצגו הפניות חדשות
 *
 * @param {Object} req הבקשה: req.params.referalId (מזהה ההפניה), req.currentUser (המשתמשת המחוברת)
 * @param {Object} res התשובה: מחזירה את ההפניה המעודכנת
 * @returns {Promise<void>}
 */
const markReferalAsRead = async (req, res) => {

    //* מסמנת שההפניה נקראה.רק המטופל / ת שההפניה שלהם יכולים לסמן אותה.
    const referal = await Referal.findById(req.params.referalId);
    if (!referal) {
        throw new AppError('ההפניה לא נמצאה', 404, 'not found');

    }
    if (String(referal.patientId) !== String(req.currentUser.id)) {

        throw new AppError('אין הרשאה לעדכן הפניה של משתמש אחר', 403, 'auth error');
    }
    referal.status = 'read';
    await referal.save();
    res.json(referal);
}
export { createReferal, getReferalForPatient, markReferalAsRead }
