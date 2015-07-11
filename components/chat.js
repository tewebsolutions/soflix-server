/**
 * Chat module.
 * @module components/chat
 */
 
module.exports = function(app) {
    var ret = {};
    
    ret.message = function(req){
        var room = req.data.room,
        user = req.data.user, message = req.data.message;
        
        var msg_obj = {
            from: user,
            message: message
        };
        
        //console.log("chat.message from ",user, " room ",room.id, " message ", message);
        app.io.room(room.id).broadcast("chat:message",msg_obj);
    }
    
    return ret;
}