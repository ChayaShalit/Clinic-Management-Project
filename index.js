import express from 'express'
import morgan from 'morgan';
import mongoose from 'mongoose';
import cors from 'cors';
import {env} from './config/env.js'
import {connectDB } from './config/db.js';
import { startReminderJob } from './jobs/reminder.job.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app =express();

connectDB();

app.use(express.json());

app.use(morgan('dev'));

app.use(cors());

// app.get('/api/health',(req,res)=>{
//     res.status(200).json({stutus:'ok',message:'השרת עובד בהצלחה'})
// })

startReminderJob();

app.use(errorHandler);



app.listen(env.PORT ,()=>{
    console.log(`Server is running on http://localhost:${env.PORT}`)
})
