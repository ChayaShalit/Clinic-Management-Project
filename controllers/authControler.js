import { Patient } from "../models/Patient.model.js";
import Doctor from "../models/Doctor.model.js";
import { User } from "../models/User.model.js";
import{createToken} from "../services/jwt.services.js"
import { AppError } from '../utils/AppError.js';

/**
 * פונקציית רישום (Register):
 * מטרה: אחראית על תהליך הרשמת משתמש חדש למערכת. היא בודקת האם האימייל כבר קיים, 
 * יוצרת מסמך משתמש חדש ב-User, ולאחר מכן יוצרת פרופיל מקביל בהתאם לתפקיד (Patient או Doctor). 
 * במידה ויש שגיאה ביצירת הפרופיל הספציפי, היא מבצעת "גלגול אחורה" (Rollback) ומוחקת את המשתמש שנוצר כדי למנוע נתונים יתומים.
 * מחזירה: תגובת HTTP 201 (Created) הכוללת הודעת הצלחה, אסימון JWT (Token) ואת פרטי המשתמש הבסיסיים.
 */
export const register =async (req,res,next) => {

    const {tz,name,email,password} =req.body

    const role = req.body.role === 'doctor' ? 'doctor' : 'patient'
 
    // בדיקה האם המשתמש כבר קיים לפי האימייל
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new AppError('האימייל כבר קיים במערכת','400','auth error')   
    }

    const newUser =await User.create({tz,name,email,password,role});
  
    try{

        if(role === 'patient'){
        await Patient.create({
            userId: newUser._id,
        });
    }
    else {
        await Doctor.create({ userId: newUser._id });
    }

     } catch (err) {
        await User.findByIdAndDelete(newUser._id);   // לא משאירים משתמש יתום
        throw err;
    }

    res.status(201).json({
        massege:'המשתמש נרשם בהצלחה!',
       token: createToken(newUser),  //שליחה ליצירת תוקן
        user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        })
}

/**
 * פונקציית התחברות (LogIn):
 * מטרה: מאמתת את פרטי ההתחברות של המשתמש (אימייל וסיסמה). היא שולפת את המשתמש יחד עם הסיסמה המוצפנת,
 * משווה את הסיסמה שהוזנה מול ההצפנה במסד הנתונים, ואם הכל תקין מייצרת עבורו אסימון גישה חדש.
 * מחזירה: תגובת HTTP 200 (OK) הכוללת הודעת הצלחה, אסימון JWT (Token) ואת פרטי המשתמש, או מעבירה שגיאה ל-Middleware במידה והפרטיים שגויים.
 */
export const logIn = async (req,res,next) => {
try{
    const {email ,password}=req.body

   const user = await User.findOne({email}).select('+password')

   if(!user || !(await user.comparePassword(password))){
        throw new AppError ('אימייל או סיסמא שגויים','401','auth error')
   }

    return res.status(200).json({
        massege:'התחברת בהצלחה!',
        token:createToken(user),
        user:{
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role }
        })
    }
    catch(error){
        return next(error)
    }
}





    

