const mongoose=require('mongoose');
const Schema=mongoose.Schema;

mongoose.Promise=global.Promise;

const tagSchema= new Schema({
    tag_name:String,
    number_of_posts: Number                 
});

const Tag = module.exports = mongoose.model("Tag", tagSchema);

module.exports.addTag=(tag_name,callback)=>{
    Tag.findOne({tag_name:tag_name},(err,tag)=>{
        if(tag){
            var num=tag.number_of_posts;
            num=num+1;
            Tag.findOneAndUpdate({tag_name:tag.tag_name},{number_of_posts:num},callback);
        }
        else{
            Tag.create({tag_name:tag_name, number_of_posts:1});
        }
    });
}

module.exports.reduceTag=(tag_name, callback)=>{
    Tag.findOne({tag_name:tag_name},(err,tag)=>{
        if(tag){
            var num=tag.number_of_posts;
            num=num-1;
            if(num==0){
                Tag.findOneAndRemove({tag_name:tag_name},callback);
            }
            Tag.findOneAndUpdate({tag_name:tag_name},{number_of_posts:num}, callback);
        }
    });
}
