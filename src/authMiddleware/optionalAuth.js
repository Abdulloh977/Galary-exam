import dotenv from 'dotenv'
import JWT from 'jsonwebtoken'

dotenv.config()

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

const optionalAuth = (req, res, next) => {
    try {
        let token = req.headers.token || req.headers.authorization;

        if (token && token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }

        if (token) {
            const decodeUser = JWT.verify(token, JWT_SECRET_KEY);
            req.user = decodeUser;
        }
    } catch (error) {
    }

    next();
}

export default optionalAuth;