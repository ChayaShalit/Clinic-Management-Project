import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true
    },

    specialty: {
        type: String// תחום התמחות, אם רלוונטי
    },

    appointmentDuration: {
        type: Number,
        default: 15,
        
    },

    workStartTime: {
        type: String, 
        default: '08:00' ,     // שעת הגעה, למשל '08:00'
        required: true
    },

    workEndTime: {
        type: String,
        default: '17:00',       // שעת יציאה, למשל '17:00'
        required: true
    },

    dayOff: {
        type: String,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },

    breaks: [
        {
            startTime: String,
            endTime: String
        }
    ]
});

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;