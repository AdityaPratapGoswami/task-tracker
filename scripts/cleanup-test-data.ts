
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Inline schemas to ensure we can delete from all collections
const UserSchema = new mongoose.Schema({ email: String, name: String }, { strict: false });
const TaskSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.Mixed, title: String }, { strict: false });
const CategorySchema = new mongoose.Schema({ userId: mongoose.Schema.Types.Mixed, name: String }, { strict: false });
const JournalSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.Mixed }, { strict: false });
const GratitudeSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.Mixed }, { strict: false });
const ProfileSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.Mixed, name: String }, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Journal = mongoose.models.Journal || mongoose.model('Journal', JournalSchema);
const Gratitude = mongoose.models.Gratitude || mongoose.model('Gratitude', GratitudeSchema);
const Profile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);

async function cleanup() {
    try {
        await mongoose.connect(MONGODB_URI!);
        console.log('Connected to DB');

        // 1. Identify Test Users
        const testEmails = ['user1@example.com', 'user2@example.com', 'test@test.com'];
        const testUsers = await User.find({
            $or: [
                { email: { $in: testEmails } },
                { name: { $regex: /Test User/i } }
            ]
        });

        if (testUsers.length === 0) {
            console.log('No test users found.');
        } else {
            console.log(`Found ${testUsers.length} test users: ${testUsers.map(u => u.email).join(', ')}`);
        }

        const testUserIds = testUsers.map(u => u._id);

        // 2. Delete Data for Test Users
        if (testUserIds.length > 0) {
            console.log('Deleting data for get users...');
            await Task.deleteMany({ userId: { $in: testUserIds } });
            await Category.deleteMany({ userId: { $in: testUserIds } });
            await Journal.deleteMany({ userId: { $in: testUserIds } });
            await Gratitude.deleteMany({ userId: { $in: testUserIds } });
            await Profile.deleteMany({ userId: { $in: testUserIds } });
            await User.deleteMany({ _id: { $in: testUserIds } }); // Delete users last
            console.log('Test user data deleted.');
        }

        // 3. Delete Broken Data (Missing userId)
        console.log('Deleting broken data (missing userId)...');
        const brokenTasks = await Task.deleteMany({ userId: { $exists: false } });
        console.log(`Deleted ${brokenTasks.deletedCount} broken tasks.`);

        const brokenCategories = await Category.deleteMany({ userId: { $exists: false } });
        console.log(`Deleted ${brokenCategories.deletedCount} broken categories.`);

        // 4. Delete items with "Test" in name (orphaned or created by mistake)
        console.log('Deleting explicit test items (by name)...');
        const testTasks = await Task.deleteMany({ title: { $regex: /Test/i } });
        console.log(`Deleted ${testTasks.deletedCount} tasks with "Test" in title.`);

        const testCategories = await Category.deleteMany({ name: { $regex: /Test/i } });
        console.log(`Deleted ${testCategories.deletedCount} categories with "Test" in name.`);

        const testProfiles = await Profile.deleteMany({ name: { $regex: /Test/i } });
        console.log(`Deleted ${testProfiles.deletedCount} profiles with "Test" in name.`);

        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        process.exit();
    }
}

cleanup();
