import Pin from "../model/pinModel.js";
import fs from "fs";
import path from "path";

const pinCtrl = {
    // Yangi Pin (Rasm) yuklash
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

            // Rasmni papkaga saqlash
            await file.mv(uploadPath);

            // Teglarni massiv ko'rinishiga o'tkazish (agar matn ko'rinishida kelsa)
            let finalTags = [];
            if (tags) {
                finalTags = Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim());
            }

            const newPin = await Pin.create({
                title,
                description,
                imageUrl: fileName,
                tags: finalTags,
                owner: req.user.id // authMiddleware'dan kelayotgan user ID
            });

            res.status(201).json({ message: "Rasm muvaffaqiyatli yuklandi!", pin: newPin });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Barcha rasmlarni olish (Bosh sahifa uchun)
    getAllPins: async (req, res) => {
        try {
            // Rasmlarni egasi (owner) ma'lumotlari bilan birga tortib keladi
            const pins = await Pin.find().populate("owner", "username firstname lastname profilePicture");
            res.status(200).json({ pins });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Bitta rasmni to'liq ko'rish (ID bo'yicha)
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

    // Rasmni o'chirish (Faqat egasi yoki admin o'chira oladi)
    deletePin: async (req, res) => {
        try {
            const { id } = req.params;
            const pin = await Pin.findById(id);

            if (!pin) {
                return res.status(404).json({ message: "Rasm topilmadi!" });
            }

            if (pin.owner.toString() === req.user.id || req.userIsAdmin) {
                // Papkadagi fizik faylni o'chirish
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

    // Layk bosish va qaytarib olish (Toggle Like)
    likePin: async (req, res) => {
        try {
            const { id } = req.params;
            const pin = await Pin.findById(id);

            if (!pin) {
                return res.status(404).json({ message: "Rasm topilmadi!" });
            }

            // Foydalanuvchi oldin layk bosganini tekshirish
            const isLiked = pin.likes.includes(req.user.id);

            if (isLiked) {
                // Laykni olib tashlash
                pin.likes = pin.likes.filter(userId => userId.toString() !== req.user.id);
            } else {
                // Layk qo'shish
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
