import Pin from "../model/pinModel.js";
import Comment from "../model/commentModel.js";
import Board from "../model/boardModel.js";
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

<<<<<<< HEAD
            // Fayl nomida kirill harflar yoki bo'shliq bo'lsa, brauzer so'rovni
            // to'g'ri yubora olmasligi (ERR_BLOCKED_BY_CLIENT/404) mumkin edi.
            // Shuning uchun faqat lotin harf/raqam/tire/pastki chiziqni qoldiramiz.
            const ext = path.extname(file.name);
            const baseName = path.basename(file.name, ext)
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "") // diakritik belgilarni olib tashlash
                .replace(/[^a-zA-Z0-9_-]+/g, "-") // lotin bo'lmagan (kirill va h.k.) belgilarni "-" bilan almashtirish
=======
            const ext = path.extname(file.name);
            const baseName = path.basename(file.name, ext)
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "") 
                .replace(/[^a-zA-Z0-9_-]+/g, "-") 
>>>>>>> 333512382f5096887a931aff4417694b2df2bc64
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");

            const safeName = baseName ? `${baseName}${ext}` : `image${ext}`;
            const fileName = `${Date.now()}_${safeName}`;
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
<<<<<<< HEAD
                owner: req.user.id 
=======
                owner: req.user.id
>>>>>>> 16af8b1cada0f6588fd967d89bdb512de81c2b7c
            });

            res.status(201).json({ message: "Rasm muvaffaqiyatli yuklandi!", pin: newPin });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Qidiruv — sarlavha (title) yoki teglar (tags) bo'yicha
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

    // 1. YANGILANDI: Barcha rasmlarni olish (isPrivate true bo'lganlarini lentadan yashiradi)
    getAllPins: async (req, res) => {
        try {
            // isPrivate maydoni true bo'lmagan (ya'ni false yoki umuman yo'q) pinlarni topadi
            const pins = await Pin.find({ isPrivate: { $ne: true } })
                .populate("owner", "username firstname lastname profilePicture");
            res.status(200).json({ pins });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Bitta rasmni to'liq ko'rish (ID bo'yicha)
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

    // 2. YANGILANDI: Top rasmlarni olishda ham yashirin rasmlar chiqmaydi
    getTopPins: async (req, res) => {
        try {
            const pins = await Pin.aggregate([
                {
                    // Aggregation boshlanishida isPrivate true bo'lganlarini o'tkazib yuboramiz
                    $match: { isPrivate: { $ne: true } }
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

    // Rasmni o'chirish
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
<<<<<<< HEAD

                // Rasm o'chirilganda unga tegishli barcha izohlar ham o'chadi
                await Comment.deleteMany({ pin: id });

                // Rasm o'chirilganda barcha category (board)lardan ham olib tashlanadi
=======
                await Comment.deleteMany({ pin: id });
>>>>>>> 333512382f5096887a931aff4417694b2df2bc64
                await Board.updateMany({ pins: id }, { $pull: { pins: id } });

                return res.status(200).json({ message: "Rasm muvaffaqiyatli o'chirildi!" });
            } else {
                return res.status(403).json({ message: "Sizda bu rasmni o'chirish huquqi yo'q!" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Layk bosish logikasi
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

    // 3. YANGI QO'SHILDI: Frontend'dagi checkbox bosilganda maxfiylikni saqlaydigan funksiya
    updatePin: async (req, res) => {
        try {
            const { id } = req.params;
            const { isPrivate } = req.body; // true yoki false qiymat keladi

            const pin = await Pin.findById(id);

            if (!pin) {
                return res.status(404).json({ message: "Rasm topilmadi!" });
            }

            // Faqat rasm egasi holatni o'zgartira olishi uchun tekshirish
            if (pin.owner.toString() !== req.user.id) {
                return res.status(403).json({ message: "Sizda bu rasmni yashirish huquqi yo'q!" });
            }

            // isPrivate qiymatini yangilaymiz
            pin.isPrivate = isPrivate;
            await pin.save();

            res.status(200).json({ message: "Rasm holati muvaffaqiyatli yangilandi", pin });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default pinCtrl;
