import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    userId:{
            type:Schema.Types.ObjectId,
            ref:'users',
            required:true,
            unique: true
        },
    specialty: {
        type: String // תחום התמחות, אם רלוונטי
    },
    appointmentDuration: {
        type: Number,      // כמה דקות כל תור
        default: 15,
        
    },
    workStartTime: {
        type: String, 
        default: '08:00'      // שעת הגעה, למשל '08:00'
    },
    workEndTime: {
        type: String,
        default: '17:00'         // שעת יציאה, למשל '17:00'
    },
    dayOff: {
        type: String,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        // יום חופשי קבוע בשבוע
    },
    breaks: [
        {
            startTime: String, // למשל '13:00'
            endTime: String    // למשל '14:00'
        }
    ],
  
});

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;