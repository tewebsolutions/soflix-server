/**
 * Files module responsible for AWS SNS, S3, ElasticTranscoder
 * Handles file uploads, transcoding, download
 * 
 * Depends on AWS S3, Must supply Credentials as a JSON in constants.AWS_CREDS
 * 
 * It will generate buckets under sflix_{USER_ID}
 * 
 * 
 * Create the following notifications for SNS and supply the configuration
 * 
 * sflix_notification_progressing
 * sflix_notification_completed
 * sflix_notification_warning
 * sflix_notification_error
 * 
 * @module components/livedata
 */


var AWS = require('aws-sdk');
var http = require('http'),
    https = require("https");
var fs = require('fs');
var temp = require('temp');
var os = require('os');
var url = require('url');
//var Uploader = require('s3-upload-stream').Uploader;
var zlib = require('zlib');
var knox = require("knox");



var s3 = new AWS.S3(), awsCred;
var elastictranscoder = new AWS.ElasticTranscoder();
var active = true;

module.exports = function(app)
{

    try {
        awsCred = AWS.config.loadFromPath(app.constants.AWS_CREDS);
    }
    catch (e)
    {
        if (e.code == 'ENOENT')
        {
            console.log("Did not find AWS Creds, disabling File Uploads");
            active = false;
        }
        
    }

    /** 
     * createPipeline - Create an Elastic Transcoder Pipeline for the User
     * @param {String} user_id 
     * @param {Function} cb - callback function
     */
    var createPipeline = function(user_id, cb)
    {
        var params = {};
        
        var bucket_input = "sflix_"+user_id+"", bucket_output = "sflix_"+user_id+"_out";
        
        params.Name = "transcoder_"+user_id;
        params.InputBucket = bucket_input;
        params.OutputBucket = bucket_output;
        
        params.Role = "arn:aws:iam::217950473442:role/Elastic_Transcoder_Default_Role";
        params.Notifications = {
            "Progressing": exports.AWS_SNS_URL+":sflix_notification_progressing",
            "Completed": exports.AWS_SNS_URL+":sflix_notification_completed",
            "Warning": exports.AWS_SNS_URL+":sflix_notification_warning",
            "Error": exports.AWS_SNS_URL+":sflix_notification_error"
        };
        
        elastictranscoder.createPipeline(params, function(err, data){
            console.log("ElasticTranscoder creating pipeline ",err,data);
            
            cb(err, data);
        })
    }
    
    /** 
     * createPipeline - Create an S3 Bucket for the User
     * Creates new S3 buckets:  sflix_{USER_ID} ,  sflix_{USER_ID}_out
     * @param {String} user_id 
     * @param {Function} cb - callback function
     */
     
var createS3Bucket = function(user_id, cb)
{
    var bucket_name = "sflix_"+user_id, bucket_out_name = "sflix_"+user_id+"_out";
    var params = {
        
        ACL: "bucket-owner-full-control",
        Bucket: bucket_name,
    };
    
    var params_out = {
        ACL: "bucket-owner-full-control",
        Bucket: bucket_out_name,
    };
    
    
        s3.createBucket(params, function(err, data){
            console.log("Creating Bucket ",data);
            cb(err, data);
        });
    
 
}

    /** 
     * uploadS3File - Upload local file to S3
     * @param {String} bucket 
     * @param {String} path 
     * @param {String} key
     * @param {Function} cb - callback function
     */
     
var uploadS3File = function(bucket, path, key, cb)
{
    console.log("uploadS3File ",bucket, path, key)
    var read = fs.createReadStream(path), err=null;

    
    var client = knox.createClient({
        key: awsCred.accessKeyId
      , secret: awsCred.secretAccessKey
      , bucket: bucket
    });
    
    
    fs.stat(path, function(err, stat){
      // Be sure to handle `err`.
    
      var req = client.put(key, {
          'Content-Length': stat.size
        , 'Content-Type': 'video/mp4'
      });
    
      fs.createReadStream(path).pipe(req);
    
      req.on('response', function(res){
          cb(err, res);
        console.log("Uploaded file", res);
      });
    });


}

 /** 
     * convertVideo - Converts video using Elastic Transcoder, after upload succeeds
     * @param {String} user_id 
     * @param {String} key 
     * @param {String} key
     * @param {Function} cb - callback function
     * 
     * TODO: Implement pipelineID, and presetID from AWS config
     */

var convertVideo = function(user_id, key) 
{
    var pipelineID = '1393060988652-i67fp9', presetID = '1386476321317-psvcbz';
    var inputKey = key, outputKey = key+".mp4";
    console.log("inputKey ",inputKey, "\n","outputKey",outputKey);
    var pipelineName = "transcoder_"+user_id;
    createS3Bucket(user_id, function(err, data){
         var jobParams = {
        PipelineId: pipelineID,
        Input: {
            Key: inputKey
        },
        Output: {
            Key: outputKey,
            PresetId: presetID
        },
    };
    
    
   elastictranscoder.createJob(jobParams, function(err, data){
            console.log("Create Job",err,data);
        })
   
    })
}

 /** 
     * download - Downloads remote file to local file, used for DropBox integration
     * 
     * @param {String} url_vid 
     * @param {Function} cb - callback function
     * 
     * TODO: Implement error handlers
     */
var download = function (url_vid, cb) {
 if (!url_vid)
    return
    
    var tmpDir = os.tmpdir();

    temp.track();

    var stream = temp.createWriteStream(), error=null;

    var url_vid_protocol = url.parse(url_vid).protocol;

    var download_req;
    var download_stream_handler = function (res) {
        res.pipe(stream);
        stream.on("finish", function (req) {
            console.log("saved ", url_vid, "file", this.path);
            if (typeof cb == "function") {
                cb(null, stream);
            }
        });
        stream.on("error", function (req) {
            console.log("saved file", this.path);
            if (typeof cb == "function") {
                cb(error, stream);
            }
        });
    }

    if (url_vid_protocol == "https:") {
        console.log("File is HTTPS");
        download_req = https.get(url_vid, download_stream_handler, function (err) {
            console.log(err);
        });
    } else {
        console.log("File is HTTP");
        download_req = http.get(url_vid, download_stream_handler);
    }


    console.log("Temp Directory: ", tmpDir);
};

 /** 
     * uploadFile - coordinates multiple calls
     * Fetches the current user
     * Creates S3 bucket with the user's name
     * Creates a MongoDB entry for the video
     * Download the Dropbox link URL to local temp file
     * Upload local temp file to S3 store
     * 
     * @param {Object} req 
     * @param {Object} res 
     * @param {String} user_id 
     * 
     * TODO: Use proper buckets for deploying to s3
     */

var uploadFile = function(req, res, user_id){
    
    var user_id = app.auth.getUser();
    console.log("User ",JSON.stringify(user_id));
    
    var video, video_title = req.body.video_title;
    var url = req.body.file_url;
    
    var user = app.models.schema.User.fetchCurrent(req, res, function(req, res, err, data){
        
        video = new models.models.Video({owner_id: user_id, title: video_title});
        
        app.files.createS3Bucket(user_id, function(err, data)
        {
            if (err)
                return;
            
            var s3bucket = "soflix";    
            
            console.log(err, data);
            
            console.log("Created new video ", video, url);
            app.files.download(url, function(err, data)
            {
                var downloadPath = data.path;
                var key = video.id;
                
                console.log("File download ",err, data);
                
                app.files.uploadS3File(s3bucket, downloadPath, key, function(err, data){
                    console.log("Uploaded file: ",err , data);
                    video.url = data.Location;
                    video.save();
                    
                });
                
            });
        });
        
        
    })
    
    res.end();
    
}

 /** 
     * getS3Buckets - Get contents of S3 bucket
     * 
     * 
     * @param {Object} req 
     * @param {Object} res 
     * 
     */

var getS3Buckets = function(req, res){
    app.files.s3.listObjects({Bucket: 'mp.processed'}, function (err, data) {
        console.log(err, data);
    res.send(data.Contents);
});
}

var ret = {};
ret.s3 = s3;
ret.createS3Bucket = createS3Bucket;
ret.getS3Buckets = getS3Buckets;
ret.uploadS3File = uploadS3File;
ret.uploadFile = uploadFile;
ret.download = download;
ret.convertVideo = convertVideo;
return ret;
}