import multer
 from "multer";
 import  path  from "path";

 const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"files/")
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+path.extname(file.originalname))
    }
 })
 const fileFilter = (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (allowed.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('סוג קובץ לא מורשה'))
    }
}
/**
 * אחרי שלוחצים על יצירת ההפניה ומעלים קובץ 
 * מייד קופצים למדלוואר שבא בודקים 
 * שהקובץ הוא מסוג PDF או מסוג תמונה וכן לא חרג מגודל של 5MB
 * בתוך IF שואלים האם המערך שהגדרתי אותו פה בתוך הפונקציה של סוגי הקבצים  האם הוא מוכל בתוך הסיומת של הקובץ כלומר 
 * האם זה קובץ או תמונה
 */
 const files=multer({storage:storage,
    fileFilter: fileFilter,
    limits:{fileSize:5*1024*1024}
 })
 export default files;
