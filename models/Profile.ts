import mongoose, { Schema, Document, model } from 'mongoose';

export interface IProfile extends Document {
    userId: string;
    name: string;
    updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true },
    },
    { timestamps: true }
);

// Prevent re-compilation of model
const Profile = mongoose.models.Profile || model<IProfile>('Profile', ProfileSchema);

export default Profile;
