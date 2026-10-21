import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true
    },

    specialty: {
        type: String
    },

    appointmentDuration: {
        type: Number,
        default: 15,
        required: true
    },

    workStartTime: {
        type: String,
        required: true
    },

    workEndTime: {
        type: String,
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