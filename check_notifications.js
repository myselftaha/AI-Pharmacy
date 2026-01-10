
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const notificationSchema = new mongoose.Schema({
    type: String,
    title: String,
    message: String,
    isRead: Boolean,
    priority: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const recent = await Notification.find().sort({ createdAt: -1 }).limit(5);
        console.log('Recent Notifications:');
        console.log(JSON.stringify(recent, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

check();
