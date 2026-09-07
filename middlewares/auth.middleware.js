import jwt from "jsonwebtoken"
import {env} from '../config/env.js'
import { User } from "../models/User.model.js"; 

//לשימוש בנתיבים מוגנים כגון: צפייה בפרופיל האישי, קביעת תור, או צפייה בהפניות רפואיות

export const auth =async (req,res,next) => {

    try{
          const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const error = new Error('אין טוקן מזהה או מבנה שגוי') ;
            error.status = 401;
            error.type= 'token error'
            return next(error);
        }
        const token = authHeader.split(' ')[1];

        const userData= jwt.verify(token,env.JWT_SECRET_KEY)

        const userExists = await User.findById(userData.id);

        if(!userExists){
            const error =new Error('המשתמש המשויך לטוקן זה אינו קיים במערכת') ;
            error.status= 401;
            error.type='auth error';
            return next(error);

        }
            req.currentUser = { id: userExists._id, role:userExists.role}
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
    
    const error = new Error('גישה חסומה: נדרשת הרשאת רופא');
    error.status = 403;
    error.type = 'auth error';
    next(error);
}

//עבור נתיבים מיוחדים לפציינים
export const authPatient = (req,res,next)=>{

    if(req.currentUser && req.currentUser.role === 'patient'){

        return next()
    }
    
    const error = new Error('גישה חסומה: נדרשות הרשאות מטופל');
    error.status = 403;
    error.type = 'auth error';
    next(error);
}