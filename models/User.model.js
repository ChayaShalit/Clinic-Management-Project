import {model,Schema} from 'mongoose'
import bcrypt from 'bcrypt'


const userSchema = new Schema(
  {
    tz:{
        type:String,
        required:[true,'נא להזין מספר זהות'],
        unique:true,
        trim:true,
        maxlength:[9,'אורך מספר זהות עד 9 תוים']
    },
    name: {
      type: String,
      required: [true, 'נא להזין שם מלא'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'נא להזין כתובת אימייל'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'כתובת אימייל לא תקינה'],
    },
    password: {
      type: String,
      required: [true, 'נא להזין סיסמה'],
      minlength: [6, 'סיסמה חייבת להכיל לפחות 6 תווים'],
    },
    profileImage: {
      type: String,
      default: 'default-profile.png',
    },
    phone: {
      type: String,
      required: [true, 'נא להזין מספר טלפון'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
  },
  { timestamps: true }
);

//פונקצית הצפנת הסיסמא ,
//  מצפינה את הסיסמא של המשתמש ושומרת בדטהבייס את הסיסמא המוצפנת
userSchema.pre('save',async function (next){
    if (!this.isModified('password')) 
        return next()
    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password,salt);
        next()
    }
    catch(err){
        next(err)   
    }
});

userSchema.methods.comparePassword= async function (passwordFromUser){

        return await bcrypt.compare(passwordFromUser,this.password);
}

export const User =model('users',userSchema)