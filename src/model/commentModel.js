import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true
        },
        pin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pin', 
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', 
            required: true
        },
        // Agar bu izoh boshqa izohga javob bo'lsa, o'sha izohning ID'si shu yerda saqlanadi
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: null
        }
    },
    {
        timestamps: true 
    }
);

export default mongoose.model('Comment', commentSchema);
