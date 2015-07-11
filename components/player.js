/**
 * Player module. 
 * Transmits player events
 * 
 * @module components/player
 */

module.exports = function(app) {
    
/**
 * transmitEvent - Checks permissions and broadcasts player events
 *
 * @param {Object} Express IO Request
 */

var transmitEvent = function(req){
    var room = req.data.room,
        user = req.data.source,
        event = req.data.name;
    
    if (room && user && event)
    {
        var broadcast = checkPermission(room, user, event);
        if (broadcast)
        {
            req.io.broadcast('playerevent', req.data)
        }
    }
}

/**
 * transmitStatus - Checks permissions and broadcasts status
 *
 * @param {Object} Express IO Request
 */

var transmitStatus = function(req){
    var room = req.data.room;
    var user = req.data.source;
    var roomdata;
    
    if (room && user)
    {
            roomdata = app.rooms[room.id];
            if (roomdata)
            {
                roomdata.updateStatus(user, req.data.status);
            }
    }
}

/**
 * checkPermission - Checks permissions and returns true/false
 * @param {Object} room
 * @param {Object} user
 * @param {String} event
 */
var checkPermission = function (room, user, event)
{
     
    var roles = {};
    roles['admin']=['volume','mute','unmute','fullscreen','fullscreenexit','begin','finish','pause','resume','start','stop','seek','status'];
    roles['viewer']=['status'];
    
    var isAdmin = (user.id == room.owner_id);

    
    if (isAdmin)
        return roles['admin'].indexOf(event) > -1;
    else
        return roles['viewer'].indexOf(event) > -1;
    
}

var ret = {
        event: transmitEvent,
        status: transmitStatus
    };

return ret;
}