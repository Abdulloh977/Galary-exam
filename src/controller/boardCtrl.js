import Board from "../model/boardModel.js";
import User from "../model/userModel.js";

const boardCtrl = {
    // Yangi doska yaratish
    createBoard: async (req, res) => {
        try {
            const { title } = req.body;
            if (!title) {
                return res.status(400).json({ message: "Doska nomi (title) majburiy!" });
            }

            const newBoard = await Board.create({
                title,
                owner: req.user.id
            });

            res.status(201).json({ message: "Doska muvaffaqiyatli yaratildi!", board: newBoard });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Bitta doskani ichidagi barcha Pin (rasm)lari bilan birga ko'rish
    getOneBoard: async (req, res) => {
        try {
            const { id } = req.params;
            const board = await Board.findById(id).populate("pins");

            if (!board) {
                return res.status(404).json({ message: "Doska topilmadi!" });
            }

            res.status(200).json({ board });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Doskaga rasm (Pin) qo'shish yoki undan olib tashlash (Toggle Pin)
    addPinToBoard: async (req, res) => {
        try {
            const { boardId, pinId } = req.body;

            const board = await Board.findById(boardId);
            if (!board) return res.status(404).json({ message: "Doska topilmadi!" });

            if (board.owner.toString() !== req.user.id) {
                return res.status(403).json({ message: "Bu doska sizga tegishli emas!" });
            }

            const pinExists = board.pins.includes(pinId);

            if (pinExists) {
                board.pins = board.pins.filter(id => id.toString() !== pinId);
            } else {
                board.pins.push(pinId);
            }

            await board.save();
            res.status(200).json({ message: pinExists ? "Rasm doskadan olib tashlandi" : "Rasm doskaga qo'shildi", board });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Boshqa birovning doskasini o'ziga saqlab qo'yish (SavedBoards tizimi)
    saveBoardToUser: async (req, res) => {
        try {
            const { boardId } = req.params;
            const user = await User.findById(req.user.id);

            const isSaved = user.savedBoards.includes(boardId);

            if (isSaved) {
                user.savedBoards = user.savedBoards.filter(id => id.toString() !== boardId);
            } else {
                user.savedBoards.push(boardId);
            }

            await user.save();
            res.status(200).json({ message: isSaved ? "Doska saqlanganlardan olib tashlandi" : "Doska profilga saqlab qo'yildi" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default boardCtrl;
