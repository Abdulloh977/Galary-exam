import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import JWT from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer'; // Alohida fayl qilmasdan shu yerda chaqirdik

dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;


const transporter = nodemailer.createTransport({
    service: '@gmail.com',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});



const tempAuthStore = new Map();

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

            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const hashedPassword = await bcrypt.hash(password, 10);

            tempAuthStore.set(email, {
                type: 'signup',
                firstname,
                lastname,
                email,
                password: hashedPassword,
                otpCode,
                expiresAt: Date.now() + 5 * 60 * 1000 
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Galary-exam: Ro'yxatdan o'tishni tasdiqlash",
                text: `Assalomu alaykum! Ro'yxatdan o'tish kodingiz: ${otpCode}. Bu kod 5 daqiqa amal qiladi.`
            });

            res.status(200).json({ message: "Verification code sent to your email!" });

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

            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

            tempAuthStore.set(email, {
                type: 'login',
                userId: user._id,
                userRole: user.role,
                otpCode,
                expiresAt: Date.now() + 5 * 60 * 1000
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Galary-exam: Tizimga kirishni tasdiqlash",
                text: `Tizimga kirish uchun tasdiqlash kodingiz: ${otpCode}. Uni hech kimga bermang!`
            });

            res.status(200).json({ message: "Verification code sent to your email for login!" });

        } catch (error) {
            console.error("Login Error:", error);
            res.status(500).json({ message: error.message });
        }
    },

    verifyOtp: async (req, res) => {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({ message: "Email and code are required!" });
            }

            const tempData = tempAuthStore.get(email);

            if (!tempData) {
                return res.status(400).json({ message: "Code expired or request not found!" });
            }

            if (Date.now() > tempData.expiresAt) {
                tempAuthStore.delete(email);
                return res.status(400).json({ message: "Verification code expired!" });
            }

            if (tempData.otpCode !== code) {
                return res.status(400).json({ message: "Wrong verification code!" });
            }

            if (tempData.type === 'signup') {
                const newUser = await User.create({
                    firstname: tempData.firstname,
                    lastname: tempData.lastname,
                    email: tempData.email,
                    password: tempData.password
                });

                tempAuthStore.delete(email);
                let { password, ...otherDetails } = newUser._doc;

                const token = JWT.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET_KEY, { expiresIn: "30d" });
                return res.status(201).json({ message: "Signup success!", user: otherDetails, token });
            }

            if (tempData.type === 'login') {
                const user = await User.findById(tempData.userId);
                tempAuthStore.delete(email);
                let { password, ...otherDetails } = user._doc;

                const token = JWT.sign({ id: user._id, role: user.role }, JWT_SECRET_KEY, { expiresIn: "30d" });
                return res.status(200).json({ message: "Login success!", user: otherDetails, token });
            }

        } catch (error) {
            console.error("OTP Verification Error:", error);
            res.status(500).json({ message: error.message });
        }
    }
};

export default authCtrl;
