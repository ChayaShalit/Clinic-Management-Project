import { jwt  } from "jsonwebtoken"
import {env} from '../config/env.js'
import { User } from "../models/User.model.js"; 

//לשימוש בנתיבים מוגנים כגון: צפייה בפרופיל האישי, קביעת תור, או צפייה בהפניות רפואיות

export const auth =async (req,res,next) => {

    try{
          const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return next({ status: 401, error: new Error('אין טוקן מזהה או מבנה שגוי') });
                }
        const token = authHeader.split(' ')[1];

        const userData= jwt.verify(token,env.JWT_SECRET_KEY)

        const userExists = await User.findById(userData.id);

        if(!userExists){
            
            return next({ status: 401, error: new Error('המשתמש המשויך לטוקן זה אינו קיים במערכת') });

        }
            req.currentUser = { id: userExists._id, role:userExists.role}
            next()
    }
    
    catch(err){
          next({ status: 401, error: new Error('no token') });
    }
}

//עבור נתיבים מיוחדים לרופאים
export const authDoctor = (req,res,next)=>{

    if(req.currentUser && req.currentUser.role === 'doctor'){

        return next()
    }
    next({ status: 403, error: new Error('גישה חסומה: נדרשת הרשאת רופא') });
}

//עבור נתיבים מיוחדים לפציינים
export const authPatient = (req,res,next)=>{

    if(req.currentUser && req.currentUser.role === 'patient'){

        return next()
    }
    next({ status: 403, error: new Error('גישה חסומה: נדרשות הרשאות מטופל') });
}