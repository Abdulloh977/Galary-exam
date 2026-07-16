import Comment from "../model/commentModel.js";
import Pin from "../model/pinModel.js";

const commentCtrl = {
    // Rasmga yangi izoh yozish (yoki boshqa izohga javob yozish)
    createComment: async (req, res) => {
        try {
            const { text, pinId, parentComment } = req.body;

            if (!text || !pinId) {
                return res.status(400).json({ message: "Matn va rasm ID-si yozilishi shart!" });
            }

            const newComment = await Comment.create({
                text,
                pin: pinId,
                user: req.user.id,
                parentComment: parentComment || null
            });

            const populatedComment = await newComment.populate("user", "username firstname lastname profilePicture");

            res.status(201).json({ message: "Izoh qo'shildi!", comment: populatedComment });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Ma'lum bir rasmga tegishli hamma izohlarni olish
    getPinComments: async (req, res) => {
        try {
            const { pinId } = req.params;
            
            // Izohlar va ularni yozgan foydalanuvchilar ma'lumotlarini tortib keladi
            const comments = await Comment.find({ pin: pinId }).populate("user", "username firstname lastname profilePicture");
            
            res.status(200).json({ comments });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Izohni o'chirish (izoh egasi, rasm egasi yoki admin o'chira oladi)
    deleteComment: async (req, res) => {
        try {
            const { id } = req.params;
            const comment = await Comment.findById(id);

            if (!comment) {
                return res.status(404).json({ message: "Izoh topilmadi!" });
            }

            const pin = await Pin.findById(comment.pin);
            const isCommentOwner = comment.user.toString() === req.user.id;
            const isPinOwner = pin && pin.owner.toString() === req.user.id;

            if (isCommentOwner || isPinOwner || req.userIsAdmin) {
                await Comment.findByIdAndDelete(id);
                return res.status(200).json({ message: "Izoh muvaffaqiyatli o'chirildi!" });
            } else {
                return res.status(403).json({ message: "Sizda bu izohni o'chirish huquqi yo'q!" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default commentCtrl;
