import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import JWT from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const authCtrl = {
    signup: async (req, res) => {
        try {
            const { firstname, lastname, email, password } = req.body;

            if (!firstname || !lastname || !email || !password) {
                return res.status(400).json({ message: "Please fill all fields!" });
            }

            const oldUser = await User.findOne({ email });
            if (oldUser) {
                return res.status(400).json({ message: "This email is already registered!" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await User.create({
                firstname,
                lastname,
                email,
                password: hashedPassword
            });

            let { password: userPassword, ...otherDetails } = newUser._doc;

           const token = JWT.sign(
                { id: newUser._id, role: newUser.role }, 
                JWT_SECRET_KEY, 
                { expiresIn: "30d" }
            );

            res.status(201).json({ message: "Signup success!", user: otherDetails, token });

        } catch (error) {
            console.error("Signup Error:", error);
            res.status(500).json({ message: error.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Please fill all fields!" });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: "Login or password is wrong!" });
            }

           const verifyPassword = await bcrypt.compare(password, user.password);
            if (!verifyPassword) {
                return res.status(400).json({ message: "Login or password is wrong!" });
            }

            let { password: userPassword, ...otherDetails } = user._doc;

            const token = JWT.sign(
                { id: user._id, role: user.role }, 
                JWT_SECRET_KEY, 
                { expiresIn: "30d" }
            );

            res.status(200).json({ message: "Login success!", user: otherDetails, token });

        } catch (error) {
            console.error("Login Error:", error);
            res.status(500).json({ message: error.message });
        }
    }
};

export default authCtrl;
