var express = require('express');
var router = express.Router();
const mongoose=require('mongoose');
const User=require('../models/user');
const Blog=require('../models/blog');
const Tag=require('../models/tags');
const   fs =   require('fs');
const validator=require('validator');
const rn=require('random-number');
var options={
    min:1000000,
    max:9999999,
    integer:true
}

//landing page
router.get('/',(req,res,next)=>{
    res.render('home');
});

router.get('/login',(req,res,next)=>{
    res.render('login');
});



//User Operations
router.post('/login',(req,res,next)=>{
    username=req.body.username;
    password=req.body.password;
    User.findOne({username:username},(err,user)=>{
        if(err)
            res.render('login-error');
        if(user){
            console.log(user)
            User.comparePassword(password, user.password, (err,isMatch)=>{
                if(err)
                    throw err
                if(isMatch){
                    res.redirect('/home/'+username+rn(options))
                }
                else
                    res.render('login-error');
            });
        }
        else
            res.render('login-error');
    });

});

router.get('/signup',(req,res,next)=>{
    res.render('signup');
})
router.post('/signup',(req,res,next)=>{
    username=req.body.username;
    User.findOne({username:username},(err, user)=>{
        if(err)
            throw err;
        if(user)
            res.render('signup-error');
        if(!validator.isEmail(req.body.email))
            res.render('signup-error')
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
                            res.redirect('/home/'+user.username+rn(options))
                    });
                }
            });
        }

    });
   
    
});

router.get('/forgot-password',(req,res,next)=>{
    res.render('forgot-password');
})

router.post('/check-user',(req,res,next)=>{
    username=req.body.username;
    User.findOne({username:username}, (err, user)=>{
        if(err)
            throw err;
        if(user){
            res.render('verify', {'user':user});
        }
        else{
            res.render('forgot-password_error')
        }
    });
});

router.post('/verify-user/:username', (req,res,next)=>{
    username=req.params.username;
    security_answer=req.body.security_answer;
    User.findOne({username:username},(err,user)=>{
        if(err)
            throw err;
        if(user.security_answer==req.body.security_answer){
            res.redirect('/change-password/'+user.username)
        }
    });
});

router.get('/change-password/:username',(req,res,next)=>{
    res.render('change-password', {'username':username});
})

router.post('/change-password/:username',(req,res,next)=>{
    password=req.body.password;
    username=req.params.username;
    User.updatePassword(username, password,(err, user)=>{
        if(err)
            throw err;
        else{
            console.log(user)
            res.redirect('http://localhost:3000/login')
        }
    });
})
//Home Page

router.get('/home/:authtoken',(req,res,next)=>{
    res.send("Success")
});
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

router.post('/delete-post/:id', (req,res,next)=>{
    Blog.findByIdAndDelete(id, (err)=>{
        if(err)
            throw err;
        else
            res.redirect('home');
    });
})



module.exports = router;