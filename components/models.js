/**
 * Module for Mongoose Schema Definitions
 * @module models/models
 */

var mongoose = require('mongoose');

module.exports = function(app) {
    
var ret = {};
ret.schema = {};
ret.models = {};
ret.schema['Video'] = new mongoose.Schema(
    {
        uid: 'ObjectId',
        video_id: Number,
        owner_id: Number,
        type: String,
        title: String,
        length: Number,
        thumb_url: String,
        video_url: String
    });    

    
ret.schema['Room'] = new mongoose.Schema(
    {
        uid: 'ObjectId',
        name: String,
        id: Number,
        short_url: String,
        is_private: Boolean,
        owner_id: String
    });

ret.schema['User'] = new mongoose.Schema(
    {
        id: String,
        displayName: String,
        name: {
            familyName: String,
            givenName: String,
            middleName: String,
        },
        status: mongoose.Schema.Types.Mixed,
        emails: mongoose.Schema.Types.Mixed,
        photos: Array
    });
    
ret.schema['User'].fetchCurrent = function(req,res,cb)
{
    if (req && req.session && req.session.passport && typeof req.session.passport.user!=="undefined")
    {
        var user_id = req.session.passport.user;
        models.User.findOne({id: user_id}, function(err, data) {
        if (data!==null && data.id)
        {
            console.log(">> schema['User'].methods.fetchCurrent(req, cb) found: ",data);
            
            
            cb(req,res,err, data);
        }
        else
        {
            console.log(">> schema['User'].methods.fetchCurrent(req, cb) not found: ",user_id);
            cb(req,res,err, data);
        }
    })
    }
    else
    {
        cb("No user ID", req.session);
        return false;
    }
}

ret.schema['User'].statics.fetchVideos = function(req,res,cb)
{
    if (req && req.session && req.session.passport && typeof req.session.passport.user!=="undefined")
        {
            var user_id = req.session.passport.user;
            this.model('User').findOne({id: user_id}, function(err, data) {
            if (data!==null && data.id)
                {
                    console.log(">> schema['User'].methods.fetchVideos found user: ",data);
                    models.Video.find({owner_id: user_id}, function(err, data) {
                            if (data!==null)
                            {
                                console.log(">> schema['User'].methods.fetchVideos found videos: ",data);
                            }
                            else
                            {
                                cb(req,res,err, data);
                            }
                            
                            });
                }
            else
                {
                    console.log(">> schema['User'].methods.fetchVideos not found: ",user_id);
                    cb(req,res,err, data);
                }
            });
    }
    else
    {
        cb("No user ID", req.session);
        return false;
    }
}


    
ret.schema['Playlist'] = new mongoose.Schema(
    {
        uid: 'ObjectId',
        playlist_id: Number,
        title: String,
        owner_id: Number,
        videos: [
                {
                    video_id: Number,
                    date_added: Number,
                }
            ]
    });        
    
var mongoose_url = app.constants.MONGO_URL;
mongoose.connect(mongoose_url);

app.db = mongoose.connection;

app.db.on('error', function(c, d){console.error("MongoDB connect error", JSON.stringify(c))});    
    
app.db.on('open', function(){
    
    ret.models.User = app.db.model('User', ret.schema.User);
    ret.models.Room = app.db.model('Room', ret.schema.Room);
    ret.models.Video = app.db.model('Video', ret.schema.Video);

    console.log("MongoDB connect ok")
    
});


return ret;

}