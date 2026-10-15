import mongoose from "mongoose";
const referalSchema = new mongoose.Schema({
doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required:true

},
patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    kindReferal: {
        type: String,
        required :true
    },
    description: {
        type: String,
        required :true,
        minlength:5
    },
    attachedFile:{
        type: String
    },
status: {
        type: String,
        enum: ['open', 'read', 'closed'],
        default: 'open'
    },

}

);

const Referal = mongoose.model('Referal',referalSchema)
export default Referal