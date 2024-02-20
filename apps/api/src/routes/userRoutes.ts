import express, {Response} from "express";
import { IRequest } from "../types/requestExtend";
import { User, Cart , Product} from "../model/allMongoModels";
import jwt from 'jsonwebtoken';
const jwtSecret = 'your-secret-key'; 
import { authenticateJWT } from "../middleware/authJWTmw";
import { checkPassword } from "../passwordchecker/passwordChecker";
import mongoose from "mongoose";

const router = express.Router();


//user routes
//user signup route
router.post("/signup", async(req: IRequest, res:Response)=>{
    const{userEmail, userPassword} = req.body;
    try {
        const user = await User.findOne({userEmail});
        if(user) return res.status(409).json({message:"email already in use"});
        const newUser = new User({userEmail:userEmail, userPassword:userPassword});
        await newUser.save();
        const token = jwt.sign({id:newUser._id}, jwtSecret ,{expiresIn: "1h"});
        res.status(200).json({message: "successfully signed up!",token })
    } catch (error) {
        res.status(500).json({message : error})
    }
})

//user login route
router.post( "/login", async(req:IRequest,res:Response)=>{
    const {userEmail, userPassword}= req.body;
    try {
        const user = await User.findOne({userEmail});
        if( !user ) return res.status(401).json({ message: "Authentication failed! no such email"});
        const fromDBPassword = user.userPassword;
        const  isMatched=checkPassword(fromDBPassword, userPassword);
        if (!isMatched) return res.status(401).json({ message: "Authentication failed!" });
        const token = jwt.sign({ id: user._id }, jwtSecret ,{ expiresIn: "1h" });
        res.status(200).json({message:`logged in successfully`, token })
    } catch (error) {
        res.status(500).json({message : error})
    }
});

//update profile  route (also needs verifyToken as middleware)
router.post("/updateprofile", authenticateJWT, async(req:IRequest, res: Response) => {
    const {userName, userAddress, userEmail,phoneNumber,profilePic} = req.body;
    try {
        const user = await User.findOneAndUpdate({userEmail:userEmail},
            {   userName:userName,
                userAddress:userAddress,
                phoneNumber:phoneNumber, 
                profilePic:profilePic,
            }, {new:true});
            if(!user) return res.status(404).json({message:"No user found  with this email."});
            res.status(200).json({message:`profile updated successfully`,user})
        
    } catch (error) {
        res.status(500).json({message : error})
    }
})


//add product to cart
router.post("/:productId/cart", authenticateJWT, async(req:IRequest, res: Response)=>{
    const userId = req.userId
    const productId = req.params.productId;
    try {
        const cart = await Cart.findOne({userId: userId});
        const product = await Product.findById(productId)
        if(!cart){
            const newCart = new Cart({
                userId: userId,
                productsInCart: [productId],
                totalAmmount: product?.price || 0
            })
            await newCart.save();
            return res.status(201).json({message:`the product was added to the cart`, newCart})
        }else {
            // If cart exists, update it
            const productIdOBJ = new mongoose.Types.ObjectId(productId);
            cart.productsInCart.push(productIdOBJ);
            cart.totalAmmount =(cart.totalAmmount || 0) + (product?.price || 0);
            await cart.save();
            return res.status(200).json({ message: `The product was added to the existing cart`, cart });
        }
       
    } catch (error) {
        res.status(500).json({message : error});
    }
})


//remove product from cart
router.delete("/:productId/cart", authenticateJWT, async(req:IRequest, res:Response)=>{
    const userId = req.userId;
    const productId = req.params.productId;
    try {
        const cart = await Cart.findOne({userId: userId});
        const product = await Product.findById(productId)
        if (!cart) return res.status(401).json({message: "You do not have a shopping cart"});
        const productIdOBJ = new mongoose.Types.ObjectId(productId);
        let indexToRemove = cart.productsInCart.indexOf(productIdOBJ);
        if(indexToRemove !== -1 ){
            cart.productsInCart.splice(indexToRemove ,1);
            cart.totalAmmount =(cart.totalAmmount || 0) - (product?.price || 0);
            await cart.save()
            return res.status(200).json({message:"Product has been removed from your cart.", cart});
        } else{
            return res.status(404).json({message:"The product was not found in your cart."})
        }
    } catch (error) {
        res.status(500).json({message : error});
    }
})






export default router;