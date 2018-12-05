var express = require('express');
var router = express.Router();
const mongoose=require('mongoose');
const User=require('../models/user');
const Blog=require('../models/blog');
const Tag=require('../models/tags');
const   fs =   require('fs');
const validator=require('validator');
const rn=require('random-number');
const request=require('request');
var options={
    min:1000000,
    max:9999999,
    integer:true
}
const loggedinuser="";
//landing page
router.get('/',(req,res)=>{
    res.render('home');
});

router.get('/login',(req,res)=>{
    res.render('login');
});



//User Operations
router.post('/login',(req,res)=>{
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
                    res.redirect('/home/'+username+'+'+rn(options))
                }
                else
                    res.render('login-error');
            });
        }
        else
            res.render('login-error');
    });

});

router.get('/signup',(req,res)=>{
    res.render('signup');
})
router.post('/signup',(req,res)=>{
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
                            res.redirect('/home/'+user.username+'+'+rn(options));
                    });
                }
            });
        }
    });    
});

router.get('/forgot-password',(req,res)=>{
    res.render('forgot-password');
})

router.post('/check-user',(req,res)=>{
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

router.post('/verify-user/:username', (req,res)=>{
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

router.get('/change-password/:username',(req,res)=>{
    res.render('change-password', {'username':req.params.username});
})

router.get('/change-password/myuser/:username',(req,res)=>{
    res.render('change-password-myuser', {username:req.params.username});
})


router.post('/change-password/:username',(req,res)=>{
    password=req.body.password;
    username=req.params.username;
    User.updatePassword(username, password,(err, user)=>{
        if(err)
            throw err;
        else{
            console.log(user)
            res.redirect('http://localhost:3000/')
        }
    });
});

router.post('/change-password/myuser/:username',(req,res)=>{
    password=req.body.password;
    username=req.params.username;
    User.updatePassword(username, password,(err, user)=>{
        if(err)
            throw err;
        else{
            console.log(user)
            res.redirect('http://localhost:3000/home/'+username+'+'+rn(options));
        }
    });
})
//Home Page

router.get('/home/:authtoken',(req,res)=>{
    Blog.allPosts((err,posts)=>{
    if(err)
        throw err;
    if(posts){
        Tag.find({},(err,tags)=>{
            if(err)
                throw err;
            if(tags){
                User.findOne({"username":req.param('authtoken').split('+')[0]},(err,user)=>{
                   if(err)
                    throw err;
                    if(user){
                        for(i=0;i<posts.length;i++){
                            posts[i].tag=posts[i].tag.split('#')[1];
                        }
                        for(i=0;i<tags.length;i++){
                            tags[i].tag_name=tags[i].tag_name.split('#')[1];
                        }
                        tags.sort({number_of_posts:-1});
                        res.render('home',{posts:posts, tags:tags, user:user});
                    }
                });
            }
        });
    }
    });
});


router.post('/create-blog',(req,res)=>{
    let blogPost={
        username:req.body.username,
        title:req.body.title,
        content:req.body.content,
        tag:req.body.tag,
        timestamp: new Date
    };
        Blog.addBlogPost(blogPost, (err,blog_post)=>{
            if(err)
                throw err;
            if(blog_post){
                console.log(blog_post);
                Tag.addTag(blogPost.tag, (err,tag)=>{
                    if(err)
                        throw err;
                    else{
                        console.log(blog_post.username);
                        res.redirect('http://localhost:3000/home/'+blog_post.username+'+'+rn(options));
                    }
                })
            }
        });
    });

router.get('/filter/tags/:loginusername/:tags',(req,res)=>{
    User.findOne({username:req.params.loginusername},(err,user)=>{
    Blog.filterUsingTag("#"+req.params.tags, (err,blog)=>{
        if(err)
            throw err;
        if(blog){
            for(i=0;i<blog.length;i++){
                blog[i].tag=blog[i].tag.split('#')[1];
            }
            res.render('filtered',{content:blog,user:user, ran:rn(options), filter:req.params.tags});
    
        }    
    });
    });
});

router.get('/filter/username/:loginusername/:username',(req,res)=>{
    User.findOne({username:req.params.loginusername},(err,user)=>{
    Blog.find({username:req.params.username}, (err,blog)=>{
        User.findOne({username:req.params.username},(err,post_user)=>{
        if(err)
            throw err;
        else{
            for(i=0;i<blog.length;i++){
                blog[i].tag=blog[i].tag.split('#')[1];
            }
            res.render('filtered',{content:blog, user:user, ran:rn(options),filter:req.params.username, post_user:post_user});
        }
        });
    });
    });
});

router.get('/myaccount/:username',(req,res)=>{
    User.findOne({username:req.params.username},(err,user)=>{
        if(err)
            throw err;
        if(user){
            Blog.find({username:req.params.username},(err,posts)=>{
                if(err)
                    throw err;
                else{
                    for(i=0;i<posts.length;i++){
                        posts[i].tag=posts[i].tag.split('#')[1];
                    }
                    res.render('myprofile',{user:user, posts:posts, ran:rn(options)});
                }
            });
        }
    });
});

//Update and Delete
router.get('/update-post/:username/:id',(req,res)=>{
    User.findOne({username:req.params.username},(err,user)=>{
        Blog.findOne({_id:req.params.id},(err,post)=>{
            if(err)
                throw err;
            if(post){
                res.render('edit-post',{user:user, post:post});
            }
        });
});
});


router.post('/update-post/:id', (req,res)=>{
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
            Tag.addTag(blogPost.tag, (err,tag)=>{
                if(err)
                    throw err;
                else{
                res.redirect('http://localhost:3000/myaccount/'+blog.username);
                }
            })
        }
        else
            res.json({success:false, msg:"Blog could not be updated!"});
    });
}
    });
});
});

router.get('/delete-post/:username/:id', (req,res)=>{
    username=req.params.username;
    Blog.findOne({_id:req.params.id},(err,blog)=>{
        if(err)
            throw err;
        if(blog)
            Tag.reduceTag(blog.tag,(err,tag)=>{
                if(err)
                    throw err;
                else{
                Blog.findOneAndDelete({_id:blog._id}, (err)=>{
                    if(err)
                        throw err;
                    else
                    res.redirect('http://localhost:3000/myaccount/'+username);
    });
}
});
});
});



module.exports = router;