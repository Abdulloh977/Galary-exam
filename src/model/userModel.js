import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstname: {
            type: String,
            required: true,
            trim: true, 
            minlength: 3
        },
        lastname: {
            type: String,
            required: true,
            trim: true,
            minlength: 3
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
            required: true,
        },
        role: {
            type: Number,
            default: 100, 
            enum: [100, 101, 102]
        },
        profilePicture: {
            type: String,
            default: "",
        }
    },
    {
        timestamps: true 
    }
)

export default mongoose.model('User', userSchema);
