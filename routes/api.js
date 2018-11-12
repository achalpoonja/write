var express = require('express');
var router = express.Router();
const mongoose=require('mongoose');
const User=require('../models/user');
const Blog=require('../models/blog');
const Tag=require('../models/tags');
const   fs =   require('fs');

//User Operations
router.post('/login',(req,res,next)=>{
    username=req.body.username;
    password=req.body.password;
    User.find({username:username},(err,user)=>{
        if(err)
            throw err;
        if(user){
            User.comparePassword(password, user[0].password, (err,isMatch)=>{
                if(err)
                    throw err
                if(isMatch)
                    res.json({success:true, msg:"Authentication Successful"});
                else
                    res.json({success:false, msg:"Authentication Failed!"});
            });
        }
    });

});

router.post('/signup',(req,res,next)=>{
    username=req.body.username;
    User.find({username:username},(err, user)=>{
        if(err)
            throw err;
        if(!user)
            res.send({success:false, message:"Username already exists"});
        else{
            let profile_picture=req.files.profile_picture;
            profile_picture.mv('./public/profile-pictures/profile_'+username+'.jpg', (err)=>{
                if(err)
                    throw err;
                else{
                    let newUser=new User({
                        username:username,
                        password:req.body.password,
                        security_question: req.body.security_question,
                        security_answer:req.body.security_answer,
                        full_name:req.body.full_name,
                        email:req.body.email,
                        profile_picture:'http://localhost:3000/profile-pictures/profile_'+username+'.jpg',
                        tagline:req.body.tagline,
                        about:req.body.about
                    });
                    User.addUser(newUser, (err,user)=>{
                        if(err)
                            throw err;
                        else
                            res.send({success:true, message:"User registered Successfully"});
                    });
                }
            });
        }

    });
   
    
});

router.post('/check-user',(req,res,next)=>{
    username=req.body.username;
    User.find({username:username}, (err, user)=>{
        if(err)
            throw err;
        if(user){
            res.json(user);
        }
    });
});

router.post('/verify-user', (req,res,next)=>{
    username=req.body.username;
    security_question=req.body.security_question;
    security_answer=req.body.security_answer;
    User.find({username:username},(err,user)=>{
        if(err)
            throw err;
        if(user[0].security_answer==security_answer){
            res.json({'success':true});
        }
    });
});

router.post('/change-password',(req,res,next)=>{
    password=req.body.password;
    username=req.body.username;
    User.updatePassword(username, password,(err, user)=>{
        if(err)
            throw err;
        else   
            res.json({'success':true, msg:'Password updated!'})
    });
})
//Home Page
router.get('/posts',(req,res,next)=>{
    Blog.allPosts((err,post)=>{
        if(err)
            throw err;
        if(post)
            res.json(post);
    });
});

router.get('/tags', (req,res,next)=>{
Tag.find({}, (err,tags)=>{
    if(err)
        throw err;
    if(tags)
        res.json(tags);
    });
});

router.post('/create-blog',(req,res,next)=>{
    let blogPost={
        username:req.body.username,
        title:req.body.title,
        content:req.body.content,
        tag:req.body.tag,
        timestamp: new Date
    };
    Blog.find({title:blogPost.title},(err,blog)=>{
        if(err)
            throw err;
        if(!blog){
        Blog.addBlogPost(blogPost, (err,blog_post)=>{
            if(err)
                throw err;
            if(blog_post){
                Tag.addTag(blogPost.tag, (err,tag)=>{
                    if(err)
                        throw err;
                    else
                        res.json({success:true, message:"Blog Posted Successfully!"});
                })
            }
        });
    }
    });
});

router.get('/filter/tags/:tags',(req,res,next)=>{
    Blog.filterUsingTag("#"+req.params.tags, (err,tag)=>{
        if(err)
            throw err;
        if(tag)
            res.json(tag);
    });
});

router.get('/filter/username/:username',(req,res,next)=>{
    console.log(req.params.username);
    Blog.find({username:req.params.username}, (err,blog)=>{
        if(err)
            throw err;
        else
            res.json(blog);
    })
});

router.get('/blog-post/:username/:title', (req,res,next)=>{
    Blog.findOne({username:req.params.username, title:req.params.title}, (err, blog)=>{
        if(err)
            throw err;
        else
            res.json(blog)
    });
});


//Update and Delete
router.get('/blog-post/:id', (req,res,next)=>{
    Blog.findByIdAndRemove(req.params.id, (err)=>{
        if(err)
            throw err;
        else
            res.json({success:true, msg:"Deleted blog post!"});
    })
});

router.post('/update-post/:id', (req,res,next)=>{
    let blogPost={
        title:req.body.title,
        content:req.body.content,
        tag:req.body.tag,
        timestamp: new Date
    };
    Blog.findById(req.params.id, (err, blog)=>{
        if(err)
            throw err;
        if(blog)
            Tag.reduceTag(blog.tag, (err, tag)=>{
                if(err)
                    throw err;
                if(tag){
    Blog.findByIdAndUpdate(req.params.id,{title:blogPost.title, content: blogPost.content, tag: blogPost.tag, timestamp:blogPost.timestamp},(err, blog)=>{
        if(err)
            throw err;
        if(blog){
            Tag.addTag(blogPost.tag, (err,blog)=>{
                if(err)
                    throw err;
                else
                res.json({success:true, msg:"Blog updated!"});
            })
        }
        else
            res.json({success:false, msg:"Blog could not be updated!"});
    });
}
    });
});
});



module.exports = router;