import { Patient } from "../models/Patient.model.js";
import Doctor from "../models/Doctor.model.js";
import { User } from "../models/User.model.js";
import{createToken} from "../services/jwt.services.js"
import { AppError } from '../utils/AppError.js';


export const register =async (req,res,next) => {

    console.log('you are in register function')


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





    

