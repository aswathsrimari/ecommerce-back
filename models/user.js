const mongoose = require('mongoose')
const crypto = require('crypto')
const uuidv1= require('uuid/v1')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true, //space end and front trimmed   
        required: true,
        maxlength: 32
    },
    email: {
        type: String,
        trim: true, //space end and front trimmed
        required: true,
        unique: 32
    },
    hashed_password: {
        type: String,
        required: true,
    },
    about: {
        type: String,
        trim: true
    },
    salt: String,  //unique long string to generate hashed password
    role: {
        type: Number,  //0-user 1-admin
        default: 0 
    },
    history: {
        type: Array,
        default: []
    }
},
{timestamps: true}
);

//virtual field

userSchema.virtual('password')
.set(function(password){
    this._password = password
    this.salt = uuidv1()
    this.hashed_password = this.encryptPassword(password)
})
.get(function(){
    return this._password
});

userSchema.methods = {

    authenticate: function(plainText){
        return this.encryptPassword(plainText)===this.hashed_password;
    },

    encryptPassword: function(password){
        if(!password){
            return '';
        }
        try{
            return crypto.createHmac('sha1',this.salt).update(password).digest('hex');
        } catch(err){
            return "";
        }
    }
};

module.exports = mongoose.model("User",userSchema);