import Pin from "../model/pinModel.js";
import Comment from "../model/commentModel.js";
import Board from "../model/boardModel.js";
import axios from "axios";
import FormData from "form-data";

const uploadImageToImgBB = async (file) => {
    try {
        const form = new FormData();
        // express-fileupload orqali kelgan fayl bufferini base64 formatiga o'tkazamiz
        form.append("image", file.data.toString("base64"));

        // O'zingizning haqiqiy ImgBB API kalitingizni shu yerga qo'ying:
        const IMGBB_API_KEY = "YOUR_IMGBB_API_KEY_HERE"; 

        const response = await axios.post(`https://imgbb.com{IMGBB_API_KEY}`, form, {
            headers: form.getHeaders(),
        });

        if (response.data && response.data.success) {
            return response.data.data.url; // Bu umrbod o'chmaydigan to'liq link (https://ibb.co...)
        } else {
            throw new Error("ImgBB yuklashda xatolik berdi");
        }
    } catch (error) {
        console.error("ImgBB xatoligi:", error.message);
        throw new Error("Rasmni saqlash omboriga yuklashda xatolik bo'ldi.");
    }
};

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

            // 💡 TUZATILDI: Local serverga saqlash (file.mv) o'rniga ImgBB cloud'ga yuklaymiz
            const permanentImageUrl = await uploadImageToImgBB(file);

            let finalTags = [];
            if (tags) {
                finalTags = Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim());
            }

            // 💡 TUZATILDI: imageUrl qismiga endi fayl nomi emas, to'liq o'chmas havola saqlanadi
            const newPin = await Pin.create({
                title,
                description,
                imageUrl: permanentImageUrl, 
                tags: finalTags,
                owner: req.user.id
            });

            res.status(201).json({ message: "Rasm muvaffaqiyatli yuklandi!", pin: newPin });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    searchPins: async (req, res) => {
        try {
            const { query } = req.query;

            if (!query || query.trim() === "") {
                return res.status(400).json({ message: "Qidiruv so'zi (query) kiritilishi shart!" });
            }

            const searchRegex = new RegExp(query.trim(), "i");

            const pins = await Pin.find({
                $or: [
                    { title: searchRegex },
                    { tags: searchRegex }
                ]
            }).populate("owner", "username firstname lastname profilePicture");

            res.status(200).json({ count: pins.length, pins });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getAllPins: async (req, res) => {
        try {
            const pins = await Pin.find({
                $or: [
                    { isPrivate: false },
                    { isPrivate: { $exists: false } }
                ]
            }).populate("owner", "username firstname lastname profilePicture");
            res.status(200).json({ pins });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getOnePin: async (req, res) => {
        try {
            const { id } = req.params;

            const pin = await Pin.findByIdAndUpdate(
                id,
                { $inc: { views: 1 } },
                { new: true }
            ).populate("owner", "username firstname lastname profilePicture");

            if (!pin) {
                return res.status(404).json({ message: "Rasm topilmadi!" });
            }

            res.status(200).json({ pin });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getTopPins: async (req, res) => {
        try {
            const pins = await Pin.aggregate([
                {
                    $match: {
                        $or: [
                            { isPrivate: false },
                            { isPrivate: { $exists: false } }
                        ]
                    }
                },
                {
                    $addFields: {
                        likesCount: { $size: "$likes" },
                        popularityScore: { $add: [{ $size: "$likes" }, "$views"] }
                    }
                },
                { $sort: { popularityScore: -1 } },
                { $limit: 12 },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    }
                },
                { $unwind: "$owner" },
                {
                    $project: {
                        title: 1,
                        description: 1,
                        imageUrl: 1,
                        tags: 1,
                        views: 1,
                        likes: 1,
                        likesCount: 1,
                        popularityScore: 1,
                        createdAt: 1,
                        "owner.username": 1,
                        "owner.firstname": 1,
                        "owner.lastname": 1,
                        "owner.profilePicture": 1
                    }
                }
            ]);

            res.status(200).json({ pins });
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
                // 💡 TUZATILDI: Mahalliy Render xotirasidan (fs.unlink) o'chirish keraksiz bo'lgani uchun olib tashlandi
                await Pin.findByIdAndDelete(id);
                await Comment.deleteMany({ pin: id });
                await Board.updateMany({ pins: id }, { $pull: { pins: id } });

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
    },

    updatePin: async (req, res) => {
        try {
            const { id } = req.params;
            const { isPrivate } = req.body;

            const pin = await Pin.findById(id);

            if (!pin) {
                return res.status(404).json({ message: "Rasm topilmadi!" });
            }

            if (pin.owner.toString() !== req.user.id) {
                return res.status(403).json({ message: "Sizda bu rasmni yashirish huquqi yo'q!" });
            }

            pin.isPrivate = isPrivate;
            await pin.save();

            res.status(200).json({ message: "Rasm holati muvaffaqiyatli yangilandi", pin });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default pinCtrl;