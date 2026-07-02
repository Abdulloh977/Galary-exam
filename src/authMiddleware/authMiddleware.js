import dotenv from 'dotenv'
import JWT from 'jsonwebtoken'

dotenv.config() 

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

const authMiddleware = (req, res, next) => {
    req.userIsAdmin = false;

    try {
        let token = req.headers.token || req.headers.authorization;
        
        if (token && token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }
        
        if (!token) {
            return res.status(401).json({ message: 'Token is required!' })
        }

        const decodeUser = JWT.verify(token, JWT_SECRET_KEY);
        req.user = decodeUser;

        if (decodeUser.role === 102) {
            req.userIsAdmin = true;
        }

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        
        return res.status(401).json({ message: 'Invalid or expired token!' });
    }
}

export default authMiddleware;
