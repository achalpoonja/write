const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const Schema=mongoose.Schema;

mongoose.Promise=global.Promise;

const userSchema= new Schema({
                    username: String,
                    password:String,
                    security_question:String,
                    security_answer: String,
                    full_name:String,
                    email:String,
                    profile_picture:String,
                    tagline:String,
                    about:String
});

const User = module.exports = mongoose.model("User", userSchema);

module.exports.addUser=(user, callback)=>{
    bcrypt.genSalt(10, (err,salt)=>{
        bcrypt.hash(user.password, salt, (err,hash)=>{
            if(err){
                throw err
            }
            else{
                user.password=hash;
                User.create(user, callback);
            }
        });
    });
}

module.exports.comparePassword=(candidatePassword, hash, callback)=>{
    bcrypt.compare(candidatePassword, hash, (err, isMatch)=>{
        if(err)
            throw err;
        callback(null, isMatch);
    });
}

module.exports.updatePassword=(username, password, callback)=>{
    bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(password, salt, (err,hash)=>{
            if(err){
                throw err;
            }
            password=hash;
            User.findOne({username:username},(err, user)=>{
                if(err){
                    throw err;
                }
                else{
                    user.password=password;
                    user.save(callback);
                }
            });
    });
    });
};
