import User from "../model/userModel.js";
import Pin from "../model/pinModel.js";
import Board from "../model/boardModel.js";
import Comment from "../model/commentModel.js";
import bcrypt from "bcrypt";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const userCtrl = {
    getProfile: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.findById(id)
                .select("-password")
                .populate("savedBoards");

            if (!user) {
                return res.status(404).json({
                    message: "User not found!"
                });
            }

            let isOwner = false;

            if (req.user) {
                isOwner = req.user.id.toString() === id.toString();
            }

            let pins = [];
            let boards = [];

            if (isOwner) {
                pins = await Pin.find({ owner: id });
            } else {
                pins = await Pin.find({
                    owner: id,
                    isPrivate: false,
                });
            }

            boards = await Board.find({ owner: id }).populate("pins");

            res.status(200).json({
                user,
                pins,
                boards,
                isOwner
            });

        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    },

    getAll: async (req, res) => {
        try {
            const users = await User.find().select("-password");
            res.status(200).json({ message: "Get all users!", users });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    },

    getOne: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id).select("-password");

            if (!user) {
                return res.status(404).json({ message: "User not found!" });
            }
            res.status(200).json({ message: "Found user!", user });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            if (id === req.user.id || req.userIsAdmin) {

                const user = await User.findByIdAndDelete(id);

                if (!user) {
                    return res.status(404).json({ message: "User not found!" });
                }

                const userPins = await Pin.find({ owner: id });
                const pinIds = userPins.map(pin => pin._id);

                await Comment.deleteMany({ pin: { $in: pinIds } });

                await Comment.deleteMany({ user: id });

                await Board.updateMany({ pins: { $in: pinIds } }, { $pull: { pins: { $in: pinIds } } });

                await Pin.updateMany({ likes: id }, { $pull: { likes: id } });

                await Pin.deleteMany({ owner: id });
                await Board.deleteMany({ owner: id });

                return res.status(200).json({ message: "User and all gallery data deleted successfully!" });
            } else {
                return res.status(403).json({ message: "You are not allowed to delete this user!" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    },

    blockUser: async (req, res) => {
        try {
            const { id } = req.params;
            const myId = req.user.id;

            if (id === myId) {
                return res.status(400).json({ message: "O'zingizni bloklay olmaysiz!" });
            }

            await User.findByIdAndUpdate(myId, { $addToSet: { blockedUsers: id } });

            res.status(200).json({ message: "Foydalanuvchi bloklandi!" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    unblockUser: async (req, res) => {
        try {
            const { id } = req.params;
            const myId = req.user.id;

            await User.findByIdAndUpdate(myId, { $pull: { blockedUsers: id } });

            res.status(200).json({ message: "Foydalanuvchi blokdan chiqarildi!" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { firstname, lastname, email, password, username } = req.body || {};

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: "User not found!" });
            }

            if (req.files && req.files.profilePicture) {
                const file = req.files.profilePicture;

                const permanentImageUrl = await uploadToCloudinary(file, "gallery-app/avatars");
                user.profilePicture = permanentImageUrl;
            }

            if (firstname) user.firstname = firstname;
            if (lastname) user.lastname = lastname;
            if (username) user.username = username;
            if (email) user.email = email;

            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }

            const updatedUser = await user.save();
            updatedUser.password = undefined;

            res.status(200).json({
                message: "User updated successfully!",
                user: updatedUser
            });

        } catch (error) {
            console.error("Update User Error:", error);
            res.status(500).json({ message: "Server error occurred!" });
        }
    }
}

export default userCtrl;