import Appointment from "../models/Appointment.model.js";
import Doctor from "../models/Doctor.model.js";

const getTodaysAppointments = async (doctorId) => {
    const today = new Date();
    const startOfDay=new Date(today.setHours(0,0,0,0));
    const endOfDay=new Date(today.setHours(23,59,59,999));
    const appointments = await Appointment.find({
        doctorId: doctorId,
        date: {
            $gte: startOfDay,
            $lte: endOfDay
        },
        status: 'confirmed'
    });
    return appointments;
};

export const getDoctorProfile = async (req,res,next)=>{
    
        try{
    
            const {id}=req.params
    
            //גם את השדות שיש בתוך היוזר כמו שם  מייל וכו Doctor  מוסיפה לאוביקט של  populate הפונקציה 
            const currentDoctor =await Doctor.findOne({userId: id }).populate('userId');
    
            if(!currentDoctor){
                const err = new Error('משתמש לא נמצא!')
                err.status = 400
                return next(arr)
            }

            // אוביקט שמגיע מהמידלוואר של האימות currentUser
            if(req.currentUser.id != id){
                 const err = new Error('גישה אסורה!')
                err.status = 403
                return next(err)
            }
            return res.status(200).json({
                message: 'הפרופיל נשלף בהצלחה!',
                profile:currentDoctor
            })
    
        }catch(err){
            return next(err)
    
        }
    

}


export {getTodaysAppointments} ;
