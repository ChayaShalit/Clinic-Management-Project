import multer from "multer";
import path from "path"
import { AppError } from "../utils/AppError.js";


const storageObj = multer.diskStorage({

  destination: function (req, file, cb) {
    try {
      cb(null, 'uploads/');
    } 
    catch (err) {
      cb(err, null);
    }
  },

  filename: function (req, file, cb) {
    try {
     //מגדיר סיומת יחודית לקובץ
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

      //null- אומר אין שגיאות 
        //  multer הפרמטר השני מעביר את הסיומת החדשה של הקובץ לספריה  
      cb(null, uniqueSuffix + path.extname(file.originalname));
    } 
    catch (err) {
      cb(err, null);
    }
  }
});

const fileFilter = (req, file, cb) => {
  try {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('רק קבצי תמונה מותרים להעלאה!'), false);
    }
  } catch (err) {
    cb(err, false);
  }
};
//מפעיל את הפונקציות הנל שהן רק תכונות 
export const upload =multer({
    storage:storageObj,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

