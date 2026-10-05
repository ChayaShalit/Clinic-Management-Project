import multer
 from "multer";
 import  path  from "path";
const fileFilter = (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (allowed.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('סוג קובץ לא מורשה'))
    }
}
 const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"files/")
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+path.extname(file.originalname))
    }
 })
 const files=multer({storage:storage})
 export default files;
