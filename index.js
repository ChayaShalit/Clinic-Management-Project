import 'dotenv/config';
import { env } from './config/env.js'
import express from 'express'
import morgan from 'morgan';
import mongoose from 'mongoose';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { startReminderJob } from './jobs/reminder.job.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { referalRouter } from './routes/referalRoutes.js'
import { authRouter } from './routes/authRouter.js'
import { patientRouter } from './routes/patientRouter.js';
import { appointmentrouter } from './routes/appointmentRoutes.js'
import { doctorRouter } from './routes/doctorRoutes.js'
import { doctorScheduleRouter } from './routes/doctorScheduleRoutes.js'
import { reminderRouter } from './routes/reminderroutes.js'
import {profileRouter} from './routes/profileRouter.js'


const app = express();

connectDB();

app.use('/uploads', express.static('uploads'));

app.use('/files', express.static('files'))

app.use(express.json());

app.use(morgan('dev'));

app.use(cors());

app.use('/api/appointments', appointmentrouter)

app.use('/api/', doctorRouter)

app.use('/api/doctors/me/schedule', doctorScheduleRouter)

app.use('/api/', referalRouter)

app.use('/api/auth', authRouter)

app.use('/api/patient', patientRouter)

app.use('/api/', reminderRouter)

app.use('api/profile',profileRouter)


startReminderJob();

app.use(errorHandler);



app.listen(env.PORT, () => {
    console.log(`Server is running on http://localhost:${env.PORT}`)
})
