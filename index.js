import express from 'express'
import morgan from 'morgan';
import mongoose from 'mongoose';
import cors from 'cors';
import {env} from './config/env.js'
import {connectDB } from './config/db.js';
import cron from 'node-cron';

const app =express();

connectDB();

app.use(express.json());

app.use(morgan('dev'));
mongoose.connectDB();

app.listen(env.PORT ,()=>{
    console.log(`Server is running on http://localhost:${env.PORT}`)
})
