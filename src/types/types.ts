export type Task = {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    priority: "low" | "medium" | "high";
}

export class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number){
        super(message);
        this.statusCode = statusCode;
    }
}