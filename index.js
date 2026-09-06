import express from 'express'
import morgan from 'morgan';
import mongoose from 'mongoose';
import cors from 'cors';
import {env} from './config/env.js'
import {connectDB } from './config/db.js';
import { startReminderJob } from './jobs/reminder job.js';
const app =express();

connectDB();

app.use(express.json());

startReminderJob();

app.use(morgan('dev'));

app.listen(env.PORT ,()=>{
    console.log(`Server is running on http://localhost:${env.PORT}`)
})
