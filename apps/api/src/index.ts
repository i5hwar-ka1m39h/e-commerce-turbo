import express from "express";
import cors from 'cors';
import mongoose from "mongoose";

import userRoutes from  './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import adminRoutes from './routes/adminRoutes';


const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);


const connectDB = async() =>{
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/e_commerce_turbo');
        console.log('database is connected');
        
    } catch (error) {
        console.error(`error occured while connecting to db: ${error}`)
    }
}




connectDB().then(()=>{
    app.listen(PORT, ()=>console.log(`server is listening on port ${PORT} `));
}).catch((error)=>console.log(error));

