import express from 'express'
import {env} from './config/env.js'
import {connectDB } from './config/db.js';

const app =express();

connectDB();

app.use(express.json());

app.listen(env.PORT ,()=>{
    console.log(`Server is running on http://localhost:${env.PORT}`)
})
