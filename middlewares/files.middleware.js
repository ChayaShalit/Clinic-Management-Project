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
 const files=multer({storage:storage})
 export default files;
