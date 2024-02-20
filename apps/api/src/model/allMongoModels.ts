import mongoose from "mongoose"


const userSchema = new mongoose.Schema({
    userEmail: String,
    userPassword: String,
    userName:String,
    dateOfCreation: Date,
    userAddress: String,
    phoneNumber: String,
    profilePic: String,
    reviewsByUser: [{type : mongoose.Schema.Types.ObjectId , ref : 'Review'}], 
})

const adminSchema = new mongoose.Schema({
    adminEmail: String,
    adminPassword: String,
    adminName:String,
    dateOfCreation: Date,
    adminAddress: String,
    phoneNumber: String,
    profilePic: String,
    productsByAdmin: [{type : mongoose.Schema.Types.ObjectId , ref : 'Product'}], 
})

const productSchema = new mongoose.Schema({
    productName: String,
    productDescription: String,
    category:String,
    price:Number,
    adminOfProduct: { type : mongoose.Schema.Types.ObjectId ,ref : 'Admin' },
    reviewsByUser: [{type : mongoose.Schema.Types.ObjectId , ref : 'Review'}],
})


const reviewSchema = new mongoose.Schema({
    productId: { type : mongoose.Schema.Types.ObjectId , ref : 'Product'},
    userId: { type : mongoose.Schema.Types.ObjectId , ref : 'User'},
    rating: Number,
    comment: String,
})

const cartSchema = new mongoose.Schema({
    userId: { type : mongoose.Schema.Types.ObjectId , ref : 'User'},
    productsInCart:[{ type : mongoose.Schema.Types.ObjectId , ref : 'Product'}],
    totalAmmount: Number,
})

export const User = mongoose.model( "User", userSchema );
export const Admin = mongoose.model("Admin", adminSchema);
export const  Product = mongoose.model('Product', productSchema);
export const  Review = mongoose.model('Review', reviewSchema);
export const   Cart = mongoose.model('Cart', cartSchema);