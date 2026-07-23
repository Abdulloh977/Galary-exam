import Contact from "../model/contactModel.js";

const contactCtrl = {
    // Foydalanuvchini kontaktlarga saqlash
    saveContact: async (req, res) => {
        try {
            const { contactId } = req.body;
            const ownerId = req.user.id;

            if (!contactId) {
                return res.status(400).json({ message: "Kontakt ID yuborilishi shart!" });
            }

            if (contactId === ownerId) {
                return res.status(400).json({ message: "O'zingizni kontaktga saqlay olmaysiz!" });
            }

            const existing = await Contact.findOne({ owner: ownerId, contact: contactId });
            if (existing) {
                return res.status(200).json({ message: "Bu odam allaqachon kontaktlaringizda bor!", contact: existing });
            }

            const newContact = await Contact.create({ owner: ownerId, contact: contactId });
            const populated = await newContact.populate("contact", "username firstname lastname profilePicture");

            res.status(201).json({ message: "Kontakt saqlandi!", contact: populated });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Kontaktni ro'yxatdan olib tashlash
    removeContact: async (req, res) => {
        try {
            const { contactId } = req.params;
            const ownerId = req.user.id;

            await Contact.findOneAndDelete({ owner: ownerId, contact: contactId });

            res.status(200).json({ message: "Kontakt o'chirildi!" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Saqlangan kontaktlar ro'yxati
    getContacts: async (req, res) => {
        try {
            const ownerId = req.user.id;

            const contacts = await Contact.find({ owner: ownerId })
                .populate("contact", "username firstname lastname profilePicture")
                .sort({ createdAt: -1 });

            res.status(200).json({ contacts });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default contactCtrl;
