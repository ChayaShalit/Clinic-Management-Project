import {User} from '../models/User.model.js'
import { AppError } from '../utils/AppError.js';
import fs from 'fs/promises'


const DEFAULT_IMAGE = 'default-profile.png';

/**
 * פונקציית העלאת תמונת פרופיל (UploadProfile):
 * מטרה: אחראית על עדכון תמונת הפרופיל של המשתמש. היא מוודאת שקובץ אכן נשלח, מעדכנת את שם הקובץ במסד הנתונים,
 * מוחקת את התמונה הישנה מהשרת (במידה וקיימת ואינה תמונת ברירת המחדל) רק לאחר שהשמירה הצליחה, 
 * ובמקרה של כישלון בשמירה במסד – מנקה את הקובץ החדש שהועלה כדי שלא יישארו קבצים יתומים בשרת.
 * מחזירה: תגובת HTTP 200 (OK) הכוללת הודעת הצלחה ואת שם תמונת הפרופיל החדשה, או מעבירה שגיאה ל-Middleware במקרה של תקלה.
 */
export const UploadProfile = async (req,res,next)=>{
    try{

    const file = req.file

    //אמור להשלח ממידלוואר של אימות  user
    const {id} = req.currentUser

    if(!file)
        {
        const err = new AppError('לא נשלחה תמונה','400', 'validation error')   
        return next(err)
        }
    const user  =await User.findById(id)
    const oldImage = user.profileImage;

    user.profileImage = req.file.filename;

   try {
        await user.save();
    } catch (err) {
        await fs.unlink(req.file.path).catch(() => {});   //לא משאירים קובץ יתום - אם לא מצליח לשמור , מוחקים את מה שנכתב כבר
        throw err;
    }

      // מוחקים את הישנה רק אחרי שהשמירה הצליחה, ולא את תמונת ברירת המחדל
    if (oldImage && oldImage !== DEFAULT_IMAGE) {
        await fs.unlink(`uploads/${oldImage}`).catch(() => {});
    }
   
    res.status(200).json({
        message: 'התמונה עודכנה בהצלחה',
        profileImage: user.profileImage   // הלקוח משתמש בזה להצגת התמונה החדשה
    });

    }
    catch(err){
        return next(err)
    }
};





