import express, {Request, Response, NextFunction } from "express";
import cors from 'cors';
import mongoose, {ObjectId} from "mongoose";
import jwt, { JwtPayload } from 'jsonwebtoken';
import {User, Admin, Cart, Product, Review } from "database-model";



const app = express();
app.use(cors());
const PORT = 5000;
const jwtSecret = 'your-secret-key'; 

interface IRequest extends Request{
    userId?:string;
}


const connectDB = async() =>{
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/e_commerce_turbo');
        console.log('databse is connected');
        
    } catch (error) {
        console.error(`error occured while connecting to db: ${error}`)
    }
}




//password checker
const checkPassword = (userPwd:string |null|undefined , inputPwd : string): boolean=>{
    if(typeof(userPwd)!== 'string') return false;
    else {
        if(userPwd===inputPwd) return true;
        else return false;
    }
}


//authentiacate token middleware;
const authenticateJWT = async(req:IRequest, res:Response, next:NextFunction)=>{
    const token = req.headers.authorization;
    if(!token)return res.status(401).json({ message: 'No token provided' });
    try {
        const decodeJwt = jwt.verify(token, jwtSecret) as JwtPayload;
        if(!decodeJwt) return res.status(401).json({ message: 'verification failed' });
        req.userId = decodeJwt.id;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
}

//user routes
//user signup route
app.post("/api/user/signup", async(req: IRequest, res:Response)=>{
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
app.post( "/api/user/login", async(req:IRequest,res:Response)=>{
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
app.post("/api/user/updateprofile", authenticateJWT, async(req:IRequest, res: Response) => {
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

//product route 
//get all the product
app.get('/api/products', async(req: IRequest,res:Response)=> {
    try {
        const product = await Product.find({});
        if(!product) return res.status(404).json({message:"No product found."});
        res.status(200).json({message:`here is a list of product`, product});
    } catch (error) {
        res.status(500).json({message : error})
    }
});

//get individual product by id 
app.get("/api/products/:productId", async(req:IRequest, res:Response)=>{
    const {productId}=req.params;
    try {
        const singleProduct = await  Product.findById(productId);
        if (!singleProduct) return res.status(404).json({message:"The product with the given ID was not found."});
        res.status(200).json({message:`here is the product with given id`, singleProduct});
    } catch (error) {
        res.status(500).json({message : error})
    }
});

//reviw route
//get reviews
app.get("/api/products/:productId/reviews", async(req:IRequest, res:Response)=>{
    const {productId}=req.params;
    try {
        const singleProduct = await  Product.findById(productId);
        if (!singleProduct) return res.status(404).json({message:"The product with the given ID was not found."});
        const reviewsArray =singleProduct.reviewsByUser;
        const reviewSingle = reviewsArray.map(id=>new mongoose.Types.ObjectId(id));
        const reviews = await  Review.find({_id:{$in:reviewSingle}});
        res.status(200).json({message:`here is the product with given id`, reviews});
    } catch (error) {
        res.status(500).json({message : error}) 
    }
})

//get individual review of product
app.get("/api/products/:productId/reviews/:reviewId", async(req:IRequest, res:Response)=>{
    const productId=req.params.productId;
    const reviewId = req.params.reviewId;
    try {
        const singleProduct = await  Product.findById(productId);
        if (!singleProduct) return res.status(404).json({message:"The product with the given ID was not found."});
        else{
            const singleReview = await Review.findById(reviewId);
            if(!singleReview) return res.status(404).json({message:"The review with the given ID was not found."});
            res.status(200).json({message:`here is the review  with given id`, singleReview});
        }
    } catch (error) {
        res.status(500).json({message : error}) 
    }
})

//post a review need token verification
app.post("/api/products/:productId/reviews", authenticateJWT, async(req:IRequest, res:Response)=>{
    const  productId=req.params.productId;
    const {rating, comment} = req.body;
    const userId = req.userId;
    try {
        const singleProduct = await  Product.findById(productId);
        const user = await User.findById(userId);
        if (!singleProduct) return res.status(404).json({message:"The product with the given ID was not found."});
        else{
            const newReview = new Review({
                productId: productId,
                comment:comment,
                rating:rating,
                userId: userId,
            });
            await newReview.save();
            singleProduct.reviewsByUser.push(newReview._id);
            await singleProduct.save();
            user?.reviewsByUser.push(newReview._id);
            await user?.save();
            res.status(200).json({message:`review was  added successfully` ,newReview});
        }   
    } catch (error) {
        res.status(500).json({message : error}) 
    }
});

//delete  review by  user need token verification
app.delete('/api/products/:productId/reviews/:reviewId', authenticateJWT, async(req:IRequest, res:Response)=>{
    const productId = req.params.productId;
    const reviewId = req.params.reviewId;
    const  userId = req.userId;
    try {
        const singleProduct = await  Product.findById(productId);
        const user = await User.findById(userId);
        if (!singleProduct) return res.status(404).json({message:"The product with the given ID was not found."});
        else{
            const deleteReview = await Review.findByIdAndDelete(reviewId);
            const reviewIdObject = new mongoose.Types.ObjectId(reviewId);
            let indexToRemove = singleProduct.reviewsByUser.indexOf(reviewIdObject);
            let indexfromUser = user?.reviewsByUser.indexOf(reviewIdObject);
            if (indexToRemove !== -1) {
                singleProduct.reviewsByUser.splice(indexToRemove, 1);
                await singleProduct.save();
            }
            if (indexfromUser!==-1 && typeof(indexfromUser)=== 'number'){
                user?.reviewsByUser.splice(indexfromUser, 1);
                await  user?.save();
            }
            res.status(200).json({message:'the review has been deleted', deleteReview});
        }
    } catch (error) {
        res.status(500).json({message : error}) 
    }
});

//admin route
//register as admin
app.post( '/api/admin/signup', async (req:IRequest,res:Response)=> {
    const{adminEmail, adminPassword} = req.body;
    try {
        const admin = await Admin.findOne({adminEmail});
        if(admin) return res.status(409).json({message:"email already in use"});
        const newAdmin = new Admin({userEmail:adminEmail, adminPassword:adminPassword});
        await newAdmin.save();
        const token = jwt.sign({id:newAdmin._id}, jwtSecret ,{expiresIn: "1h"});
        res.status(200).json({message: "successfully signed up!",token })
    } catch (error) {
        res.status(500).json({message : error})
    }
})

//admin login
app.post( "/api/admin/login", async(req:IRequest, res:Response)=>{
    const {adminEmail, adminPassword}= req.body;
    try {
        const admin = await Admin.findOne({adminEmail});
        if( !admin ) return res.status(401).json({ message: "Authentication failed! no such email"});
        const fromDBPassword = admin.adminPassword;
        const  isMatched=checkPassword(fromDBPassword, adminPassword);
        if (!isMatched) return res.status(401).json({ message: "Authentication failed!" });
        const token = jwt.sign({ id: admin._id }, jwtSecret ,{ expiresIn: "1h" });
        res.status(200).json({message:`logged in successfully`, token })
    } catch (error) {
        res.status(500).json({message : error})
    }
});

//create product by admin
app.post("/api/admin/createproduct", authenticateJWT, async(req:IRequest, res:Response)=>{
    const {productName, productDescription, price, category} = req.body;
    const adminId = req.userId;
    try {
        const newProduct = new Product({
            productName:productName,
            productDescription:productDescription,
            price:price,
            category:category,
            adminOfProduct:adminId,
        })
        const result =  await newProduct.save()
        const idOfProduct = result._id
        res.status(200).json({message:`product saved successfully`, idOfProduct  })
    } catch (error) {
        res.status(500).json({message : error})
    }
})

//get all product by the admin;
app.get( '/api/admin/allproducts', authenticateJWT, async(req:IRequest, res:Response) => {
    const adminId = req.userId;
    try {
        const product = await Product.find({adminOfProduct:adminId});
        if(!product) return res.status(404).json({message:'No products found'});
        res.status(200).json({message:`here is the list of product`, product})
    } catch (error) {
        res.status(500).json({message : error})
    } 
})

//update product by admin
app.put('/api/admin/editproduct/:productId',authenticateJWT , async(req:IRequest,res:Response)=> {
    const  productId=req.params.productId;
    const {productName, productDescription, price, category}=req.body;
    try {
        const singleProductUpdate = await Product.findByIdAndUpdate(productId,
            {productName: productName,
            productDescription:productDescription,
            price:price,
            category:category},{new: true});

            if(!singleProductUpdate) return  res.status(404).json({message:'The product with the given ID was not found.'});
            res.status(200).json({message:`the product was updated successfully`, singleProductUpdate})
    } catch (error) {
        res.status(500).json({message : error});
    }
})

//delete the product
app.delete('/api/admin/deleteproduct/:productId', authenticateJWT , async(req:IRequest,res:Response)=>{
    const productId=req.params.productId;
    try {
        const deletedProduct = await Product.findByIdAndDelete(productId);
        if(!deletedProduct) return res.status(401).json({message:'deletion of the product failed/id is incorrect'})
        res.json(200).json({message:`product deleted successfully`, deletedProduct});
    } catch (error) {
        res.status(500).json({message : error});
    }
})

//add product to cart
app.post("/api/user/:productId/cart", authenticateJWT, async(req:IRequest, res: Response)=>{
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

connectDB().then(()=>{
    app.listen(PORT, ()=>console.log(`server is listening on port ${PORT} `));
}).catch((error)=>console.log(error));

