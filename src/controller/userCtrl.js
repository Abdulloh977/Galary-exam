import User from "../model/userModel.js";
// Rasmlar modeli ochilganda uni mana shu yerda import qilasiz:
// import Image from "../model/imageModel.js"; 
import bcrypt from "bcrypt";
import fs from "fs";
import path from 'path';

const userCtrl = {
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

                if (user.profilePicture && user.profilePicture !== '') {
                    const oldPath = path.join('src', 'public', user.profilePicture);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }

                // 2. GALEREYA UCHUN: Foydalanuvchining yuklagan hamma rasmlarini papkadan o'chirish mantiqi
                // Bu qism Image modeli tayyor bo'lganda ishlaydi:
                /*
                const userImages = await Image.find({ userId: id });
                userImages.forEach(img => {
                    const imgPath = path.join('src', 'public', img.imageUrl);
                    if (fs.existsSync(imgPath)) {
                        fs.unlinkSync(imgPath);
                    }
                });
                await Image.deleteMany({ userId: id }); // Bazadan ham o'chirish
                */

                return res.status(200).json({ message: "User and all gallery data deleted successfully!" });
            } else {
                return res.status(403).json({ message: "You are not allowed to delete this user!" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { firstname, lastname, email, password } = req.body || {};
            
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: "User not found!" });
            }

            if (req.files && req.files.profilePicture) {
                const file = req.files.profilePicture;
                
                const fileName = `${Date.now()}_${file.name}`;
                const uploadPath = path.join('src', 'public', fileName);

                if (user.profilePicture && user.profilePicture !== '') {
                    const oldPath = path.join('src', 'public', user.profilePicture); 
                    if (fs.existsSync(oldPath)) { 
                        fs.unlinkSync(oldPath);
                    }
                }

                await file.mv(uploadPath);
                user.profilePicture = fileName;
            }

            if (firstname) user.firstname = firstname;
            if (lastname) user.lastname = lastname;
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
