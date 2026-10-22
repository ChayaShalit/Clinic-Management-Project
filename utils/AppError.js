export class AppError extends Error {
    constructor(message, status = 500, type = 'server error') {
        super(message);
        this.status = Number(status);
        this.type = type;
    }
}