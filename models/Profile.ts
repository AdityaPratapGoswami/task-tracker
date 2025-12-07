import mongoose, { Schema, Document, model } from 'mongoose';

export interface IProfile extends Document {
    name: string;
    updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
    {
        name: { type: String, required: true },
    },
    { timestamps: true }
);

// Prevent re-compilation of model
const Profile = mongoose.models.Profile || model<IProfile>('Profile', ProfileSchema);

export default Profile;
