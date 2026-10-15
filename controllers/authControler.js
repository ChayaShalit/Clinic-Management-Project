import { Patient } from "../models/Patient.model.js";
import Doctor from "../models/Doctor.model.js";
import { User } from "../models/User.model.js";
import{createToken} from "../services/jwt.services.js"

export const register =async (req,res,next) => {
    console.log('you are in register function')
try{
    const {tz,name,email,password,profileImage,phone,role} =req.body

    if (role === 'patient'){
        const { dateBirth } = req.body; 
            if (!dateBirth) {
            const error =new Error('שדה תאריך לידה הוא חובה עבור מטופל') ;
            error.status= 400;
            error.type='auth error';
            return next(error);
            }   
        }

    // בדיקה האם המשתמש כבר קיים לפי האימייל
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        const error =new Error('האימייל כבר קיים במערכת' ) ;
            error.status= 400;
            error.type='auth error';
            return next(error);
    }

    const newUser =await User.create({
        tz,
        name,
        email,
        password,
        profileImage,
        phone,
        role
    });
    
    if(role == 'patient'){
        await Patient.create({
            userId: newUser._id,
            dateBirth:req.body.dateBirth
        });
    }

    else{
        const {specialty,appointmentDuration,workStartTime,workEndTime,dayOff,breaks}=req.body
        await Doctor.create({
            userId: newUser._id,
            specialty,
            appointmentDuration,
            workStartTime,
            workEndTime,
            dayOff,
            breaks
        });
    }

    //שליחה ליצירת תוקן
    const newToken = createToken(newUser)
 
    
    res.status(201).json({
        massege:'המשתמש נרשם בהצלחה!',
        newToken,
        user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }

        })

    }catch(error){
            return next(error);
    }
}


export const logIn = async (req,res,next) => {

try{
    const {email ,password}=req.body

   const user = await User.findOne({email}).select('+password')

   if(!user){
    const error = new Error ('אימייל או סיסמא שגויים')
    error.status=401
    error.type='auth error'
    return next(error);
   }

   const isMatch = await user.comparePassword(password);
   
   if(!isMatch){
     const error = new Error ('אימייל או סיסמא שגויים')
    error.status=401
    error.type='auth error'
    return next(error);
   }

    const newToken = createToken(user)

    return res.status(200).json({
        massege:'התחברת בהצלחה!',
        token:newToken,
        user:{
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
        })
    }
    catch(error){
    return next(error)
    }
}





    

