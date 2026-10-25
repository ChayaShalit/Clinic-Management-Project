import multer from "multer";
import path from "path"
import { AppError } from "../utils/AppError.js";


const storageObj = multer.diskStorage({
  /**
   * מטרה: קובעת את תיקיית היעד שבה יישמרו הקבצים המועלים על הדיסק בשרת.
   * מחזירה: אינו מחזיר ערך ישירות, אלא מעביר בקולבק (Callback) את נתיב התיקייה ('uploads/') או שגיאה.
   */

  destination: function (req, file, cb) {
    try {
      cb(null, 'uploads/');
    } 
    catch (err) {
      cb(err, null);
    }
  },

  /**
   * מטרה: יוצר ומגדיר שם קובץ ייחודי עבור הקובץ המועלא כדי למנוע התנגשויות שמות במערכת.
   * מחזירה: אינו מחזיר ערך ישירות, אלא מעביר בקולבק את שם הקובץ החדש  או שגיאה.
   */

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

/**
 * מטרה: מסנן את הקבצים המועלים ומוודא שרק קבצי תמונה (Mimetype שמתחיל ב-image/) מורשים להיכנס למערכת.
 * מחזירה: אינו מחזיר ערך ישירות, אלא מעביר בקולבק בוליאני (true לאישור או false לדחייה עם אובייקט AppError) או שגיאה.
 */

const fileFilter = (req, file, cb) => {
  try {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('רק קבצי תמונה מותרים להעלאה!','400','upload error'), false);
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

