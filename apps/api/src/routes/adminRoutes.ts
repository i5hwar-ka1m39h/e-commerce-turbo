import express,{Response} from 'express';
import { IRequest } from '../types/requestExtend';
import jwt from 'jsonwebtoken';
import { Admin, Product } from '../model/allMongoModels';
import { authenticateJWT } from '../middleware/authJWTmw';
import { checkPassword } from '../passwordchecker/passwordChecker';
const jwtSecret = 'your-secret-key'; 




const router = express.Router();




//admin route
//register as admin
router.post( '/signup', async (req:IRequest,res:Response)=> {
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
router.post( "/login", async(req:IRequest, res:Response)=>{
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
router.post("/createproduct", authenticateJWT, async(req:IRequest, res:Response)=>{
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
router.get( '/allproducts', authenticateJWT, async(req:IRequest, res:Response) => {
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
router.put('/editproduct/:productId',authenticateJWT , async(req:IRequest,res:Response)=> {
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
router.delete('/deleteproduct/:productId', authenticateJWT , async(req:IRequest,res:Response)=>{
    const productId=req.params.productId;
    try {
        const deletedProduct = await Product.findByIdAndDelete(productId);
        if(!deletedProduct) return res.status(401).json({message:'deletion of the product failed/id is incorrect'})
        res.json(200).json({message:`product deleted successfully`, deletedProduct});
    } catch (error) {
        res.status(500).json({message : error});
    }
})

export default router;