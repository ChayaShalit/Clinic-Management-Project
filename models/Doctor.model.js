import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    specialty: {
        type: String // תחום התמחות, אם רלוונטי
    },
    appointmentDuration: {
        type: Number,      // כמה דקות כל תור
        default: 15,
        required: true
    },
    workStartTime: {
        type: String,       // שעת הגעה, למשל '08:00'
        required: true
    },
    workEndTime: {
        type: String,        // שעת יציאה, למשל '17:00'
        required: true
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