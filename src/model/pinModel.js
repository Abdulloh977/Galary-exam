import mongoose from "mongoose";

const pinSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        imageUrl: {
            type: String,
            required: true
        },
        tags: [
            {
                type: String,
                trim: true
            }
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        views: {
            type: Number,
            default: 0
        },
        isPrivate: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true 
    }
);

export default mongoose.model('Pin', pinSchema);
