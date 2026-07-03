import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        firstname: {
            type: String,
            required: true,
            trim: true
        },
        lastname: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: Number,
            default: 100,
            enum: [100, 101, 102]
        },
        profilePicture: {
            type: String,
            default: ""
        },
        savedBoards: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Board'
            }
        ]
    },
    {
        timestamps: true
    }
);

export default mongoose.model('User', userSchema);
