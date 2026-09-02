import {connect} from 'mongoose'
import {env}from './env.js'

export const connectDB = async()=> {
    try{
        await connect(env.MONGO_URL);
        console.log('mongo connected succesfully');
    } catch (error) {
        console.log(error);
        process.exit(1);
}
};