const mongoose=require('mongoose');
const Schema=mongoose.Schema;

mongoose.Promise=global.Promise;

const blogSchema= new Schema({
                username:String,
                title:String,
                content:String,
                tag:String,
                timestamp:Date                    
});

const Blog = module.exports = mongoose.model("Blog", blogSchema);

module.exports.addBlogPost= (blogPost, callback)=>{
    Blog.create(blogPost, callback);
}

module.exports.updateBlogPost=(last_title, blogPost, callback)=>{
    Blog.findOneAndUpdate({title:last_title}, {content:blogPost.content, tag:blogPost.tag}, callback);        
}

module.exports.deleteBlogPost=(blogPost,callback)=>{
    Blog.findOneAndRemove({title:blogPost.title}, callback);
}

module.exports.allPosts=(callback)=>{
    Blog.find({}, callback);
}

module.exports.filterUsingTag=(tag,callback)=>{
    Blog.find({tag:tag}, callback);
}
