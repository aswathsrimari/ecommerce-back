const express=require('express')
const router=express.Router()


const { signup,signin,signout,requireSignin } = require("../controllers/auth");
const {userSignpValidator} = require('../validator/index');

router.post("/signup",userSignpValidator,signup);
router.post("/signin",signin); 
router.get("/signout",signout); 

//router.get("/hello",requireSignin, (req,res)=>{
//    res.send("hello there");
//});


module.exports = router;