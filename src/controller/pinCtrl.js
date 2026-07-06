import Pin from "../model/pinModel.js";
import fs from "fs";
import path from "path";

const pinCtrl = {
    createPin: async (req, res) => {
        try {
            const { title, description, tags } = req.body;

            if (!title) {
                return res.status(400).json({ message: "Sarlavha (title) yozilishi shart!" });
            }

            if (!req.files || !req.files.image) {
                return res.status(400).json({ message: "Rasm fayli yuklanishi shart!" });
            }

            const file = req.files.image;
            const fileName = `${Date.now()}_${file.name}`;
            const uploadPath = path.join("src", "public", fileName);

            
            await file.mv(uploadPath);

            
            let finalTags = [];
            if (tags) {
                finalTags = Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim());
            }

            const newPin = await Pin.create({
                title,
                description,
                imageUrl: fileName,
                tags: finalTags,
                owner: req.user.id 
            });

            res.status(201).json({ message: "Rasm muvaffaqiyatli yuklandi!", pin: newPin });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getAllPins: async (req, res) => {
        try {
            const pins = await Pin.find().populate("owner", "username firstname lastname profilePicture");
            res.status(200).json({ pins });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getOnePin: async (req, res) => {
        try {
            const { id } = req.params;
            const pin = await Pin.findById(id).populate("owner", "username firstname lastname profilePicture");

            if (!pin) {
                return res.status(404).json({ message: "Rasm topilmadi!" });
            }

            res.status(200).json({ pin });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deletePin: async (req, res) => {
        try {
            const { id } = req.params;
            const pin = await Pin.findById(id);

            if (!pin) {
                return res.status(404).json({ message: "Rasm topilmadi!" });
            }

            if (pin.owner.toString() === req.user.id || req.userIsAdmin) {
                const imgPath = path.join("src", "public", pin.imageUrl);
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath);
                }

                await Pin.findByIdAndDelete(id);
                return res.status(200).json({ message: "Rasm muvaffaqiyatli o'chirildi!" });
            } else {
                return res.status(403).json({ message: "Sizda bu rasmni o'chirish huquqi yo'q!" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    likePin: async (req, res) => {
        try {
            const { id } = req.params;
            const pin = await Pin.findById(id);

            if (!pin) {
                return res.status(404).json({ message: "Rasm topilmadi!" });
            }

            const isLiked = pin.likes.includes(req.user.id);

            if (isLiked) {
                pin.likes = pin.likes.filter(userId => userId.toString() !== req.user.id);
            } else {
                pin.likes.push(req.user.id);
            }

            await pin.save();
            res.status(200).json({ message: isLiked ? "Layk olib tashlandi" : "Layk bosildi", likesCount: pin.likes.length });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default pinCtrl;
