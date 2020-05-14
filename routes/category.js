const express=require('express')
const router=express.Router()



const { create,categoryById, read, update, remove, list } = require("../controllers/category");
const { requireSignin,isAuth,isAdmin } = require("../controllers/auth");
const { userById } = require("../controllers/user");

router.get("/category/:categoryId", read);
router.post("/category/create/:userId",requireSignin, isAdmin, isAuth, create);
router.put("/category/:categoryId/:userId",requireSignin, isAdmin, isAuth, update);
router.delete("/category/:categoryId/:userId",requireSignin, isAdmin, isAuth, remove);
router.get("/categories", list);




//router.get("/hello",requireSignin, (req,res)=>{
//    res.send("hello there");
//});   

router.param("userId", userById); //(parameter, callback fun)
router.param('categoryId', categoryById);
//param will be called only once for parameter detected in 
//first route path and callback fun is triggered

module.exports = router;