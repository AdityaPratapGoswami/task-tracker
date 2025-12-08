import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password?: string;
    name: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
        },
        password: {
            type: String,
        },
        name: {
            type: String,
            required: [true, 'Please provide a name'],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

export default models.User || model<IUser>('User', UserSchema);
