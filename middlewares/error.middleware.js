import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
    let { status = 500, type = 'server error', message } = err;

    if (err.name === 'CastError') {//מזהה שאינו ObjectId תקין
        status = 400; type = 'validation error'; message = 'מזהה לא תקין';
    }
    if (err.code === 11000) {// אם מנסים להכניס ערך שכבר קיים 
        status = 409; type = 'duplicate error'; message = 'הערך כבר קיים במערכת';
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        status = 401; type = 'token error'; message = 'טוקן לא תקין או שפג תוקפו';
    }

    if (err.name === 'MulterError') {
        status = 400; type = 'upload error';
        message = err.code === 'LIMIT_FILE_SIZE' ? 'הקובץ גדול מדי (עד 5MB)' : 'שגיאה בהעלאת הקובץ';
    }

    console.error(err.stack);
    res.status(status).json({
        error: { type, message, ...(env.NODE_ENV !== 'production' && { stack: err.stack }) }//נשלח ללקוח רק כשלא בפרודקשן. כך לא חושפים פרטים פנימיים כשהאתר באוויר.
    });
};