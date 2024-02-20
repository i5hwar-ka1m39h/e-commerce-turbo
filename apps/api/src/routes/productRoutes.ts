import express, {Response} from 'express';
import { IRequest } from '../types/requestExtend';
import { Product, Review, User } from '../model/allMongoModels';
import { authenticateJWT } from '../middleware/authJWTmw';
import mongoose from 'mongoose';

const router = express.Router()



//product route 
//get all the product
router.get('/', async(req: IRequest,res:Response)=> {
    try {
        const product = await Product.find({});
        if(!product) return res.status(404).json({message:"No product found."});
        res.status(200).json({message:`here is a list of product`, product});
    } catch (error) {
        res.status(500).json({message : error})
    }
});

//get individual product by id 
router.get("/:productId", async(req:IRequest, res:Response)=>{
    const {productId}=req.params;
    try {
        const singleProduct = await  Product.findById(productId);
        if (!singleProduct) return res.status(404).json({message:"The product with the given ID was not found."});
        res.status(200).json({message:`here is the product with given id`, singleProduct});
    } catch (error) {
        res.status(500).json({message : error})
    }
});


//get reviews
router.get("/:productId/reviews", async(req:IRequest, res:Response)=>{
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
router.get("/:productId/reviews/:reviewId", async(req:IRequest, res:Response)=>{
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
router.post("/:productId/reviews", authenticateJWT, async(req:IRequest, res:Response)=>{
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
router.delete('/:productId/reviews/:reviewId', authenticateJWT, async(req:IRequest, res:Response)=>{
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



export default router;