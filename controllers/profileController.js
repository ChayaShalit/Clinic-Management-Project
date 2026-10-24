import {User} from '../models/User.model.js'
import {Doctor} from '../models/Doctor.model.js'
import {Patient} from '../models/Patient.model.js'
import { AppError } from '../utils/AppError.js'

const modelByRole = { patient: Patient, doctor: Doctor };


export const getProfile = async ( req,res,next)=>{

    const {id,role}= req.currentUser

    try{

        const user = await User.findById(id);                  // שדות משותפים
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


    const USER_FIELDS = ['name', 'phone','role','email','tz'];
    
    // מחזיר אובייקט עם השדות שברשימה בלבד
    const ObjectOfUserField = (obj, keys) =>
        Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)));

    // מחזיר אובייקט בלי השדות שברשימה
    const ObjectOfRoleField = (obj, keys) =>
        Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)));


export const updateProfile = async (req,res,next)=>{
  try{
    const { id, role } = req.currentUser;
    
    const userUpdate = ObjectOfUserField(req.body, USER_FIELDS);
    const detailsUpdate = ObjectOfRoleField(req.body, USER_FIELDS); 

    // new-אומר למונגוז לשלוף את היוזר המעודכן ולא הישן
    //runValidators- מכריח לעשות בדיקות תקינות - ולידציות - גם בעדכון
    const opts = { new: true, runValidators: true };

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


  

    