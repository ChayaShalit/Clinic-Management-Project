

//טיפול בשגיאות 
export const errorHandler = (err,req,res,next) => {
    const {status=500,type='server error'}=err;

    const errorObject = {
        type: type,
        message: err.message,
        stack:err.stack       
    }

    
    console.error(`ERROR STACK: ${errorObject.stack} `)
    res.status(status).json ({error:errorObject})
}