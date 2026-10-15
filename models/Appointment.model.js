import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
   patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'patient', 
    required: true
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
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    patientName: {
        type: String
    },
    patientEmail: {
        type: String
    },
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;