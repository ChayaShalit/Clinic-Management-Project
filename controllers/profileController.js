import {User} from '../models/User.model.js'
import Doctor from '../models/Doctor.model.js'
import {Patient} from '../models/Patient.model.js'
import { AppError } from '../utils/AppError.js'

const modelByRole = { patient: Patient, doctor: Doctor };


/**
 * פונקציית שליפת פרופיל (getProfile):
 * מטרה: שולפת את נתוני המשתמש המחובר מהמסד באמצעות מזהה המשתמש (`id`) והתפקיד (`role`) מתוך `req.currentUser`. 
 * היא מבצעת שאילתה משולבת: שולפת את השדות הכלליים מטבלאות/אוסף ה-User ואת הנתונים הספציפיים לפי תפקיד (Patient או Doctor) מאוסף המודל המותאם.
 * מחזירה: תגובת HTTP 200 (OK) הכוללת הודעת הצלחה ואת אובייקט הפרופיל המכיל את נתוני המשתמש (`user`) והפרטים הנוספים (`details`), או מעבירה שגיאה אם לא נמצאו.
 */

export const getProfile = async ( req,res,next)=>{

    const {id,role}= req.currentUser

    try{

        const user = await User.findById(id);    // שדות משותפים
        const details = await modelByRole[role].findOne({ userId: id });   // שדות לפי תפקיד

        if(!user || !details){
            const err = new AppError('משתמש לא נמצא!','400')
            return next(err)
        }
        
        return res.status(200).json({
            message: 'הפרופיל נשלף בהצלחה!',
            profile: { user, details}
        })
    }
    catch(err){
       return next (err) 
    }
}


    const USER_FIELDS = ['name', 'phone','email'];
    
    // מחזיר אובייקט עם השדות שברשימה בלבד
    const ObjectOfUserField = (obj, keys) =>
        Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)));

    // מחזיר אובייקט בלי השדות שברשימה
    const ObjectOfRoleField = (obj, keys) =>
        Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)));

/**
 * פונקציית עדכון פרופיל (updateProfile):
 * מטרה: מעדכנת את פרטי הפרופיל של המשתמש המחובר. היא מפרידה בין השדות הכלליים של המשתמש (`User`) לבין השדות הספציפיים לתפקיד (`Patient`/`Doctor`) באמצעות פונקציות הסינון, 
 * בודקת שהאימייל החדש (במידה ושונו) אינו תפוס על ידי משתמש אחר, ומעעדכנת את המסד תוך הפעלת ולידציות. אם לא נשלחו שדות לעדכון באחת מהקבוצות, היא רק שולפת את הנתונים הקיימים.
 * מחזירה: תגובת HTTP 200 (OK) הכוללת הודעת הצלחה ואת אובייקט הפרופיל המעודכן, או מעבירה שגיאה במקרה של התנגשות נתונים או תקלה.
 */
export const updateProfile = async (req,res,next)=>{
  try{
    const { id, role } = req.currentUser;
    
    const userUpdate = ObjectOfUserField(req.body, USER_FIELDS);
    const detailsUpdate = ObjectOfRoleField(req.body, USER_FIELDS); 

    // new-אומר למונגוז לשלוף את היוזר המעודכן ולא הישן
    //runValidators- מכריח לעשות בדיקות תקינות - ולידציות - גם בעדכון
    const opts = { new: true, runValidators: true };

    // האימייל חייב להיות ייחודי. מוציאים את המשתמש עצמו לצורך הבדיקה
    if (userUpdate.email) {
        const taken = await User.exists({ email: userUpdate.email, _id: { $ne: id } });
        if (taken) throw new AppError('כתובת האימייל כבר רשומה במערכת', 409, 'duplicate error');
    }


    // בודק כמה שדות נשלחו לעדכון יוזר ,אם האורך יותר מ 0 מעדכן , ואם הוא 0 שולף את הנתונים שקיימים במסד הנתונים
    const user = Object.keys(userUpdate).length
        ? await User.findByIdAndUpdate(id, userUpdate, opts)
        : await User.findById(id);

    //כנל לגבי השדות שמשתנים לפי תפקיד
    const details = Object.keys(detailsUpdate).length
        ? await modelByRole[role].findOneAndUpdate({ userId: id }, detailsUpdate, opts)
        : await modelByRole[role].findOne({ userId: id });

    res.status(200).json({ message: 'הפרופיל עודכן בהצלחה', profile: { user, details } });
  }catch(err){
    return next(err)
  }
};


  

    