import 'dotenv/config';
import { env } from './config/env.js'
import express from 'express'
import morgan from 'morgan';
import mongoose from 'mongoose';
import cors from 'cors';
import {connectDB } from './config/db.js';
import { startReminderJob } from './jobs/reminder.job.js';
import { errorHandler } from './middlewares/error.middleware.js';
import{referalRouter} from './routes/referalRoutes.js'
import {authRouter} from './routes/authRouter.js'
import { patientRouter } from './routes/patientRouter.js';  
import {appointmentrouter} from './routes/appointmentRoutes.js'
import {doctorRouter} from './routes/doctorRoutes.js'
import {reminderRouter} from './routes/reminderroutes.js'

const app =express();

connectDB();

app.use('/uploads', express.static('uploads'));

app.use(express.json());

app.use(morgan('dev'));

app.use(cors());
<<<<<<< HEAD
app.use('/files',express.static('files'))
app.use('/api', referalRouter)
=======

app.use ('/appointment/',appointmentrouter)

app.use ('/api/',doctorRouter)

app.use('/api/', referalRouter)

app.use('/api/auth',authRouter)

app.use('/api/patient',patientRouter)

app.use ('/api/',reminderRouter)

>>>>>>> 591b071943551af3f51fa90554fa3db9ef487795
// app.get('/api/health',(req,res)=>{
//     res.status(200).json({stutus:'ok',message:'השרת עובד בהצלחה'})
// })

startReminderJob();

app.use(errorHandler);



app.listen(env.PORT ,()=>{
    console.log(`Server is running on http://localhost:${env.PORT}`)
})
