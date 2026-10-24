import {User} from '../models/User.model.js'
import {Doctor} from '../models/Doctor.model.js'
import {Patient} from '../models/Patient.model.js'
import { AppError } from '../utils/AppError.js'



export const getProfile = async ( req,res,next)=>{

    const {id,role}= req.currentUser

    const modelByRole = { patient: Patient, doctor: Doctor };

    try{

        const user =await User.findOne(id)
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