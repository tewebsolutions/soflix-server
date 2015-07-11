module.exports = function(app) {

/**
 * TODO: Implement Dynamic Playlist Functionality
 * 
 * Returns the appropriate playlist for a room
 */

var list = function(req, res)
{
    res.json(
        
       [{
      image: "vtts/bbb-splash.png", file: "rtmp://draco.streamingwizard.com:1935/wizard/_definst_/demo/sample.mp4", title: "Big Buck Bunny"
    },{
      image: "/images/phone-us.jpg", file: "rtmp://draco.streamingwizard.com:1935/wizard/_definst_/demo/streaming_320_v2.mp4", title: "Streaming Wizard Promo"
    },{
      image: "vtts/flashstreaming.jpg", file: "rtmp://draco.streamingwizard.com:1935/wizard/_definst_/demo/flashstreaming/gfx.flv", title: "Flashstreaming Demo"
    },{
      image: "vtts/RTV.jpg", file: "rtmp://draco.streamingwizard.com:1935/wizard/_definst_/demo/flashstreaming/RTV_reel.flv", title: "RTV Reel"
    }]

        );
}

var ret = {
        list: list
    };

return ret;    
}