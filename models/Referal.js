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
/* לכל הפניה אני יוצרת מודל שבו יש מזהה רופא כדי לדעת לאיזה רופא לשלוח. 
/* וכן מזהה מטופל 
/* סוג ההפניה לצורך ידיעת הרופא
/*התאור של הבעיה ,הבקשה
/*קובץ מצורף אופציונלי
/* סטטוס שזה אומר האם ההודעה נקראה או לא 
*/
);

const Referal = mongoose.model('Referal',referalSchema)
export default Referal