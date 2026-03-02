export class APIError extends Error {
    public statusCode: number;
    public responseBody: unknown;

    constructor(message: string, statusCode: number, responseBody: unknown) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }
}
