import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        contact: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Bir foydalanuvchi bir kishini faqat bitta marta kontaktga saqlay oladi
contactSchema.index({ owner: 1, contact: 1 }, { unique: true });

export default mongoose.model('Contact', contactSchema);
