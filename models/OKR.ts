import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKeyResult {
    title: string;
    completed: boolean;
}

export interface IOKRBase {
    userId: string; // Reference to User
    objective: string;
    keyResults: IKeyResult[];
}

export interface IOKR extends IOKRBase {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IOKRDocument extends IOKRBase, Document {
    createdAt: Date;
    updatedAt: Date;
}

const KeyResultSchema: Schema = new Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
});

const OKRSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        objective: { type: String, required: true },
        keyResults: {
            type: [KeyResultSchema],
            validate: [arrayLimit, '{PATH} exceeds the limit of 5']
        }
    },
    {
        timestamps: true,
    }
);

function arrayLimit(val: unknown[]) {
    return val.length <= 5;
}

const OKR: Model<IOKRDocument> = mongoose.models.OKR || mongoose.model<IOKRDocument>('OKR', OKRSchema);

export default OKR;
