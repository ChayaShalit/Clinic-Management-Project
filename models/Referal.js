import mongoose from "mongoose";
const referalSchema = new mongoose.Schema({
doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',

},
patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    kindReferal: {
        type: String
    },
    description: {
        type: String
    },
    attachedFile:{
        type: String
    }


}

);

const Referal = mongoose.model('Referal',referalSchema)
export default Referal