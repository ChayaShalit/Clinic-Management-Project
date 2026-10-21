export class AppError extends Error {
    constructor(message, status = 500, type = 'server error') {
        super(message);
        this.status = status;
        this.type = type;
    }
}