import jwt from 'jsonwebtoken'
import { env } from '../config/env.js';    


export const createToken = (user) => {
    const payload = {
        userId:user._id,
        role:user.role
    };

    const token = jwt.sign (payload,env.JWT_SECRET_KEY);

    return token;
}