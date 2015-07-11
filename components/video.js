/**
 * Video module.
 * Converts videos using supplied Transcoding service
 * Finds video(s) from MongoDB
 * @module components/video
 */
module.exports = function (app)
{
    /** 
     * convertVideo - Convert video from one format to another
     * @param {Object} req 
     * @param {Object} req.params.video_id - Video ID 
     */
     
    var convertVideo = function(req, res) {
        var user_id = app.auth.getUser(req, res);
        var video_id = req.params['video_id'];
        
        if (user_id !== false && video_id)
            {
                app.models.models.Video.findOne({owner_id:user_id, _id:video_id}, function(err, existing) {
                    console.log("Converting video ", user_id, " ", existing._id);
                    
                    if (!err)
                    {
                        var key = video_id;
                        
                        app.files.convertVideo(user_id, key);
                        return res.send(existing.toJSON());
                    }
                    else
                    {
                        return res.json({status: "error", error: err});
                    }
                });
            
            
            }
        else
            {
                console.log("Unauthorized", user_id);
                var msg = {status:false, error:"unauthorized"};
                 res.json(msg);
            }   
    };
    
    /** 
     * findVideos - WS wrapper around Mongoose
     * @param {Object} req 
     * @param {Object} req.params.video_id - Video ID 
     */
    
    var findVideos = function(req, res){
        var user_id = app.auth.getUser(req, res);
        
        if (user_id !== false)
            {
                app.models.models.Video.find({owner_id:user_id}, function(err, existing) {
                    console.log("Found videos ", user_id, " ", existing._id);
                    
                    if (!err && existing)
                    {
                        return res.send(existing);
                    }
                    else
                    {
                        return res.json({status: "error", error: err});
                    }
                });
            
            }
        else
            {
                console.log("Videos not found ", user_id);
                var msg = {status:false, error:"unauthorized"};
                 res.json(msg);
            }
    };



 /** 
     * findVideo - WS wrapper around Mongoose
     * @param {Object} req 
     * @param {Object} req.params.video_id - Video ID 
     */
var findVideo = function(req, res){
    var user_id = app.auth.getUser(req, res);
    var video_id = req.params.video_id;
    if (user_id !== false && video_id)
        {
            app.models.models.Video.findOne({owner_id:user_id, _id:video_id}, function(err, existing) {
                
                console.log("Found video ", user_id, " ", existing._id);
                
                if (!err)
                {
                    return res.send(existing.toJSON());
                }
                else
                {
                    return res.json({status: "error", error: err});
                }
            });
        
        
        }
    else
        {
            console.log("Unauthorized", user_id);
            var msg = {status:false, error:"unauthorized"};
             res.json(msg);
        }
};

    var ret = {
        findVideo: findVideo,
        findVideos: findVideos,
        convertVideo: convertVideo
    };
    return ret;
}