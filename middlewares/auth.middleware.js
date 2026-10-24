import jwt from "jsonwebtoken"
import {env} from '../config/env.js'
import { User } from "../models/User.model.js"; 
import { AppError } from "../utils/AppError.js";

//לשימוש בנתיבים מוגנים כגון: צפייה בפרופיל האישי, קביעת תור, או צפייה בהפניות רפואיות

export const auth =async (req,res,next) => {

    try{
          const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const error = new AppError('אין טוקן מזהה או מבנה שגוי','401','token error') ;
            return next(error);
        }
        const token = authHeader.split(' ')[1];
        
        // בודקת שהטוקן הונפק עי השרת שלנו לפי המפתח הסודי ואם כן מחלצת את הפרטים שהוצפנו
        const userData= jwt.verify(token,env.JWT_SECRET_KEY)

        //בודק שהיוזר קים במסד הנתונים
        const userExists = await User.findById(userData.userId);

        if(!userExists){
            const error= new AppError('המשתמש המשויך לטוקן זה אינו קיים במערכת','401','auth error')
            return next(error);

        }
            req.currentUser = { id:String(userExists._id),  role:userExists.role}
            next()
    }
    
    catch(error){
        error.status= 401;
        error.type='token error'
        next(error)

    }
}

//עבור נתיבים מיוחדים לרופאים
export const authDoctor = (req,res,next)=>{

    if(req.currentUser && req.currentUser.role === 'doctor'){

        return next()
    }
    
    const error = new AppError('גישה חסומה: נדרשת הרשאת רופא','40','auth error');
    next(error);
}

//עבור נתיבים מיוחדים לפציינים
export const authPatient = (req,res,next)=>{

    if(req.currentUser && req.currentUser.role === 'patient'){

        return next()
    }
    
    const error = new AppError('גישה חסומה: נדרשות הרשאות מטופל','403','auth error');
    next(error);
}