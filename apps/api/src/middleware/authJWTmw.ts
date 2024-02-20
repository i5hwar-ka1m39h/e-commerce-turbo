import jwt, {JwtPayload} from 'jsonwebtoken'
import { IRequest } from '../types/requestExtend';
import { Response, NextFunction } from 'express';
const jwtSecret = 'your-secret-key'; 


//authentiacate token middleware;
export const authenticateJWT = async(req:IRequest, res:Response, next:NextFunction)=>{
    const authHead = req.headers.authorization;
    if(!authHead)return res.status(401).json({ message: 'No token provided' });
    const token = authHead.split(' ')[1];
    try {
        const decodeJwt = jwt.verify(token, jwtSecret) as JwtPayload;
        if(!decodeJwt) return res.status(401).json({ message: 'verification failed' });
        req.userId = decodeJwt.id;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
}
