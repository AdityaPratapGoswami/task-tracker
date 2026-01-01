export interface IKeyResult {
    _id?: string;
    title: string;
    completed: boolean;
}

export interface IOKR {
    _id: string;
    userId: string;
    objective: string;
    keyResults: IKeyResult[];
    createdAt: string;
    updatedAt: string;
}
