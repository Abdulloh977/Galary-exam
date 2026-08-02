import Board from "../model/boardModel.js";
import User from "../model/userModel.js";

const boardCtrl = {

    createBoard: async (req, res) => {
        try {
            const { title } = req.body;
            if (!title) {
                return res.status(400).json({ message: "Board nomi (title) majburiy!" });
            }

            const newBoard = await Board.create({
                title,
                owner: req.user.id
            });

            res.status(201).json({ message: "Board muvaffaqiyatli yaratildi!", board: newBoard });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getMyBoards: async (req, res) => {
        try {
            const boards = await Board.find({ owner: req.user.id }).populate("pins");
            res.status(200).json({ boards });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getOneBoard: async (req, res) => {
        try {
            const { id } = req.params;
            const board = await Board.findById(id).populate("pins");

            if (!board) {
                return res.status(404).json({ message: "Board topilmadi!" });
            }

            if (board.owner.toString() !== req.user.id) {
                return res.status(403).json({ message: "Bu kategoriya sizga tegishli emas!" });
            }

            res.status(200).json({ board });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateBoard: async (req, res) => {
        try {
            const { id } = req.params;
            const { title } = req.body;

            const board = await Board.findById(id);
            if (!board) return res.status(404).json({ message: "Board topilmadi!" });

            if (board.owner.toString() !== req.user.id) {
                return res.status(403).json({ message: "Bu board sizga tegishli emas!" });
            }

            if (!title || title.trim() === "") {
                return res.status(400).json({ message: "Board nomi bo'sh bo'lmasligi kerak!" });
            }

            board.title = title.trim();
            await board.save();

            res.status(200).json({ message: "Board nomi yangilandi!", board });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deleteBoard: async (req, res) => {
        try {
            const { id } = req.params;

            const board = await Board.findById(id);
            if (!board) return res.status(404).json({ message: "Board topilmadi!" });

            if (board.owner.toString() !== req.user.id) {
                return res.status(403).json({ message: "Bu board sizga tegishli emas!" });
            }

            await Board.findByIdAndDelete(id);
            res.status(200).json({ message: "Board muvaffaqiyatli o'chirildi!" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    addPinToBoard: async (req, res) => {
        try {
            const { boardId, pinId } = req.body;

            const board = await Board.findById(boardId);
            if (!board) return res.status(404).json({ message: "Board topilmadi!" });

            if (board.owner.toString() !== req.user.id) {
                return res.status(403).json({ message: "Bu board sizga tegishli emas!" });
            }

            const pinExists = board.pins.includes(pinId);

            if (pinExists) {
                board.pins = board.pins.filter(id => id.toString() !== pinId);
            } else {
                board.pins.push(pinId);
            }

            await board.save();
            res.status(200).json({ message: pinExists ? "Rasm boarddan olib tashlandi" : "Rasm boardga qo'shildi", board });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

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
            res.status(200).json({ message: isSaved ? "Board saqlanganlardan olib tashlandi" : "Board profilga saqlab qo'yildi" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default boardCtrl;