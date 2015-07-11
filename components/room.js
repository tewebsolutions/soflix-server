/**
 * Room module.
 * @module components/room
 */
module.exports = function(app) {

    /** 
     * getRoomByOwner - Get Room by Owner 
     * @param {Object} req 
     * @param {String} req.params.owner_id 
     * @param {Object} res
     * @param {Function} next
     */
    var getRoomByOwner = function(req, res, next) {
        
        if (req.params.length < 1) 
        {
            return getRooms(req, res, next);
        }
        
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        var id = req.params.owner_id;

        app.models.room.find({
            'owner_id': id
        }, function(arr, data) {
            console.error(arr, data);
            if (data != null) {
                res.send(data);
            }
            else {
                res.send({});
            }
        });
    };

    /** 
     * getRooms - WS Wrapper around Mongoose Call
     * @param {Object} req 
     * @param {Object} res
     * @param {Function} next
     */
    var getRooms = function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");

        app.models.Room.find({}, function(err, data) {
            res.send(data);
        })
    };

    /** 
     * TODO: Implement helper for getRoomByOwner
     * getRoomByOwner
     * @param {Object} req 
     * @param {Object} res
     * @param {Function} next
     */
    var getRoomByOwner = function(req, res, next) {
        var user_id = app.auth.getUser(req, res);
        var owner_id = req.params.owner_id;
        console.log("getRoomByOwner ", user_id, " for owner ", owner_id);
        res.send({});
    };
    
    /** 
     * getRoomByID - Get Room By ID
     * @param {Object} req 
     * @param {Object} req.params.room_id 
     * @param {Object} res
     * @param {Function} next
     */    
    var getRoomByID = function(req, res, next) {
        var user_id = app.auth.getUser(req, res);
        var room_id = req.params.room_id;

        if (user_id !== false) {
            
            var query = {
                id: parseInt(room_id)
            };
            console.log("getRoomByID ", user_id, " get ", room_id, " ", query);
            app.models.Room.findOne(query, function(arr, data) {
                console.error(arr, data, query);
                if (data !== null) {
                    res.send(data);
                }
                else {
                    res.send({});
                }

            });
        }
        else {
            console.log("Unauthorized", user_id);
            var msg = {
                status: false,
                error: "unauthorized"
            };
            res.json(msg);
        }
    };

    /** 
     * updateRoomInfo - Broadcast updated information after user joins/leaves room
     * @param {Object} req 
     * @param {Object} req.data.room.id 
     */    
    var updateRoomInfo = function(req) {
        var room = req.data || {
            id: 0
        };
        var room_id = room.id;


        var user_id = app.auth.getUser(req);
        var roomdata = app.livedata[room_id];

        var userlist = [];
        for (var user in roomdata.userlist) {
            if (user == user_id) roomdata.userlist[user]['current'] = true;

            userlist.push(roomdata.userlist[user])
        }

        var data = {
            userlist: userlist
        };
        console.log("updateRoomInfo ");
        req.io.emit('session', data);
    }

    /** 
     * joinRoom - Update LiveData object with new person in room
     * @param {Object} req 
     * @param {Object} req.data.room.id 
     */   
    var joinRoom = function(req) {

        var room = req.data || {
            id: 1
        };

        var room_id = room.id;
        var user_id = app.auth.getUser(req);
        var user = null;

        app.models.User.findOne({
            id: user_id
        }, function(err, user) {
            if (!err) {
                
                if (typeof app.rooms[room_id] == "undefined") {

                    app.models.Room.findOne({
                        id: room_id.toString()
                    }, function(err, room) {
                        if (!err && !app._.isEmpty(room)) {

                            app.rooms[room_id] = new app.livedata.LiveData(room);
                            app.rooms[room_id].startBeacon(gen_updateRoomStatus(room_id), 5000);
                            console.log("creating new room session room ", room_id);
                            fn_addUserToRoom(user, room);
                            console.log("joinRoom user:", user_id, " new room:", room_id);
                        }

                    });

                }
                else {
                    var room =  app.rooms[room_id].getRoom();
                    console.log("joinRoom user:", user_id, " existing room:", room_id);
                    fn_addUserToRoom(user, room);
                }


            }
        });

    /** 
     * fn_addUserToRoom - Helper function to add user to room
     * 
     * @param {Object} room
     * @param {Object} user 
     */   
        var fn_addUserToRoom = function(user, room) {
            if (user && room)
            {
                var room_id = room.id;
                var user_id = user.id;
                console.log("Add user ",user_id," to room ", room_id);
                var roomdata = app.rooms[room_id];
                
                
                if (roomdata.addUser(user)) {
                    
                    req.io.join(room_id);
                    req.io.room(room_id).broadcast('user:join', {
                        room: room,
                        user: user
                    });
                }
            }
        }
        
    /** 
     * fn_removeUserFromRoom - Helper function to remove user from room
     * 
     * @param {Object} room
     * @param {Object} user 
     */           
    var fn_removeUserFromRoom = function(user, room) {
            if (user && room)
            {
                var room_id = room.id, user_id = user.id;
                
                console.log("Remove user ",user_id," from room ", room_id);
                var roomdata = app.rooms[room_id];
                
                if (roomdata.removeUser(user_id)) 
                    {
                        req.io.leave(room_id);
                    }
            }
        }

    }

    /** 
     * gen_updateRoomStatus - Helper function to generate LiveData callback. 
     * Stores room information locally
     * 
     * @param {Object} room
     * @param {Object} user 
     */       
    var gen_updateRoomStatus = function(room_id) {
        var room_id = room_id + 0;
        var room = app.io.room(room_id);

        return function(status) {
            if (typeof(room) == "undefined") {
                return false;
            }
            //console.log("Sending updates ",status," to room ",room_id);
            room.broadcast("session", status);
        }
    }

    /** 
     * leaveRoom - Helper function to generate LiveData callback. 
     * Stores room information locally
     * 
     * @param {String} room.id 
     * @param {Object} req 
     */    
    var leaveRoom = function(req) {
        var room = req.data || {
            id: 0
        };

        var room_id = room.id;
        var user_id = app.auth.getUser(req);

        console.log("leaveRoom user: ", user_id, " room: ", room_id);

        var room_obj = app.rooms[room_id];
        if (typeof room_obj !== "undefined") {
            room = room_obj.getRoom();
            user = room_obj.getUser(user_id);
            if (room_obj.removeUser(user_id)) {
                req.io.room(room_id).broadcast('user:leave', {
                    room: room,
                    user: existing
                })
                console.log("leaveRoom user: ", user_id, " room: ", room_id);
            }
        }

    }

    /** 
     * leaveRooms - Helper function to generate LiveData callback. 
     * Stores room information locally
     * 
     * @param {Object} req 
     * @param {String} user_id 
     */    
    var leaveRooms = function(req, user_id) {
        req = req || {};
        
        var user_id = user_id || app.auth.getUser(req),
            room;

        app._.each(app.rooms, function(room_obj, room_id) {
            room = room_obj.getRoom();
            user = room_obj.getUser(user_id);
            if (room_obj.removeUser(user_id)) {
                app.io.room(room_id).broadcast('user:leave', {
                    room: room,
                    user: user
                })
                console.log("leaveRoom user:", user_id, " room:", room_id);
            }
        });
    }

    var ret = {
        getRoomByOwner: getRoomByOwner,
        joinRoom: joinRoom,
        getRooms: getRooms,
        leaveRoom: leaveRoom,
        leaveRooms: leaveRooms,
        getRoomByID: getRoomByID,
    };


    return ret;
}