import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: true
    },
    patientEmail: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    treatmentType: {
        type: String
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    wantsReminder: {
        type: Boolean,
        default: false
    }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;