import { Patient } from "../models/Patient.model"

export const getPatientProfile = async (req,res,next)=>{

    try{

        const {id}=req.params

        //גם את השדות שיש בתוך היוזר כמו שם  מייל וכו patient  מוסיפה לאוביקט של  populate הפונקציה 
        const currentPatient =await Patient.findOne({userId: id }).populate('userId');

        if(!currentPatient){
            const err = new Error('משתמש לא נמצא!')
            err.status = 400
            return next(arr)
        }

        if(req.currentUser.id != id){
             const err = new Error('גישה אסורה!')
            err.status = 403
            return next(err)
        }
        return res.status(200).json({
            message: 'הפרופיל נשלף בהצלחה!',
            profile:currentPatient
        })

    }catch(err){
        return next(err)

    }

}
