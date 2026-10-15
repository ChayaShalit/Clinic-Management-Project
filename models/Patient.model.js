import {model,Schema} from 'mongoose'


const patientSchema = new Schema(
{
    userId:{
        type:Schema.Types.ObjectId,
        ref:'users',
        required:true,
        unique: true
    },
    dateBirth:{
        type:Date,
        required:true
    },
   //הערות רפאויות
    medicalNotes: {
        type: String,
        default: ''
    }
   
},
    { timestamps: true } 
)

export const Patient=model('patients',patientSchema)