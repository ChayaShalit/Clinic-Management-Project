export const env = {
    PORT :process.env.PORT||3000,
    MONGODB_URL:process.env.MONGODB_URL,
    JWT_SECRET_KEY:process.env.JWT_SECRET_KEY,
    BCRYPT_ROUNDS:Number(process.env.BCRYPT_ROUNDS) ||10,
    NODE_ENV: process.env.NODE_ENV
}