import {User} from '../models/User.model.js'
import fs from 'fs/promises'


export const UploadProfile = async (req,res,next)=>
    {
    try{

    const file = req.file
    //אמור להשלח ממידלוואר של אימות  user
    const {id,name,email} = req.user

    if(!file)
        {
        const err = new Error('לא נשלחה תמונה')
        err.status=400
            
        return next(err)
        }

    const {fileName,filePath}=file

    const currentUser =await User.findById(id)
    if(!currentUser)
        {
        const err= new Error('הנתונים שגויים')
        err.status=400;
        return next(err)
        }
    // אם קימת תמונה ישנה
    if (currentUser.profileImage)
         {
            try {
                //אם התמונה הישנה עדין קימת בדיסק
                await fs.access(currentUser.profileImage);
                //מוחק מהדיסק
                await fs.unlink(currentUser.profileImage);
                } 
                catch (fileErr) {
            // אם הקובץ לא קיים בדיסק, נתפוס את השגיאה ונמשיך כרגיל
                console.log('הקובץ הישן לא נמצא בדיסק, ממשיכים בעדכון');
                }
        }

    currentUser.profileImage = filePath;
    await currentUser.save();

    return res.status(200).json({
    message: 'תמונה עודכנה בהצלחה'
    })


    }
    catch(err){
        return next(err)
    }
};





