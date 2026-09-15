import { env } from './env.js'
import {connect} from 'mongoose'


export const connectDB = async()=> {
    try{
        await connect(env.MONGODB_URL);
        console.log('mongo connected succesfully');
    } catch (error) {
        console.log(error);
        process.exit(1);
}
};