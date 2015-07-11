/**
 * LiveData module. 
 * Transmits the most up to date information to all connected nodes.
 * Simple pub/sub mechanism
 * 
 * @module components/livedata
 */

module.exports = function(app) {
    var _ = app._;
    
    /** Prototype for LiveData Object. Represents a room. */
    var LiveData = function LiveData(room) {
        var self = this;
        self.meta = {};
        self.room = room;
        self.userlist = {};
        self.usermeta = {};
        self.beacon = null;
        console.log("New instance room: ", self.room);
    };
    
    LiveData.prototype.log = function ()
    {
        //console.log.apply(arguments);
    }
    
    /** 
     * Starts a Beacon, calls callback fn with specified freq. 
     * @param fn 
     * @param freq
     */
    
    LiveData.prototype.startBeacon = function (fn, freq)
    {
        var self = this;
        
        if (typeof fn == "function" && freq && (freq > 0))
        {
            self.log("addBeacon > ",freq);
            if (typeof self.beacon == "intervalObject")
            {
                clearInterval(self.beacon);
            }
            
            self.beacon = setInterval(function(){
                fn(self.beaconLight());
            }, freq);
        }
        
    }
    
    /** 
     * Stops beacon
     */
    
    LiveData.prototype.stopBeacon = function ()
    {
        var self = this;
        
        self.log("stopBeacon > ",freq);
        
        if (typeof self.beacon == "intervalObject")
            {
                clearInterval(self.beacon);
                delete self.beacon;
            }
    }
    
    /** 
     * Returns list of users
     */
     
    LiveData.prototype.beaconLight = function()
    {
        var self = this;
        
        var pkg = {userlist: _.toArray(self.userlist)};
        
        self.log("beaconLight > ",pkg);
        return pkg;
    }
    
    /** 
     * Returns room object
     */
     
    LiveData.prototype.getRoom = function()
    {
        var self = this;
        return self.room;
    }
    
    /** 
     * Set Meta Values, Key/Value Store
     * @param {String} key
     * @param {String} value
     */
    LiveData.prototype.setMeta = function(key, val)
    {
        var self = this;
        if ((typeof key !== "undefined") && (typeof val !== "undefined"))
        {
            self.meta[key] = val;
        }
        console.log('LiveData.prototype.setMeta >> ',key,' : ', val);
        
        return (self.meta[key] === val);
    }
    
    /** 
     * Get Meta Value, Returns value based on key bassed
     * @param {String} key
     */
    LiveData.prototype.getMeta = function(key)
    {
        var self = this;
        if (typeof key !== "undefined" && !_.isUndefined(self.meta[key]))
        {
            console.log('LiveData.prototype.getMeta >> ',key,' : ', self.meta[key]);
            return self.meta[key];
        }
        return false;
    }
    
    /** 
     * Adds user to room
     * @param {Object} user
     */
    LiveData.prototype.addUser = function (user)
    {
        var self = this;
        if (!_.isUndefined(user))
        {
            self.log("addUser > ",key);
            var key = user.id;
            if (!_.has(self.userlist, key))
            {
                self.userlist[key] = user.toJSON();
                self.log("addUser > ",key," > OK");
                return true;
            }
        }
        return false;
    }
    
    /** 
     * Get user from room
     * @param {String} user_id
     */
     
    LiveData.prototype.getUser = function (user_id)
    {
        var self = this;
        var key = user_id;
        self.log("getUser > ",key);
        if (_.has(self.userlist, key))
        {
            self.log("getUser > ",key," > OK");
            return self.userlist[key];
        }
        return false;
    }
    
    /** 
     * Update user information
     * @param {Object} user
     */
     
    LiveData.prototype.updateUser = function (user)
    {
        var self = this;
        var key = user.id;
        self.log("updateUser > ",key);
        if (_.has(self.userlist, key))
        {
            self.log("updateUser > ",key," > OK");
            self.userlist[key] = user;
            return self.userlist[key];
        }
        return false;
    }
    
    /** 
     * Set User Meta Values, Key/Value Store
     * @param {String} user_id
     * @param {String} key
     * @param {String} value
     */
     
    LiveData.prototype.setUserMeta = function (user_id, key, val)
    {
        var self = this;
 
        self.log("setUserMeta > ",user_id,' > ',key,' > ',val);
        if (_.isUndefined(self.usermeta[user_id]))
        {
            self.usermeta[user_id] = {};
        }
        
        self.usermeta[user_id][key] = val;
        
        self.log("updateUserMeta > ",user_id,' > ',key,' > ',val, ' > OK');
     
        
        return self.usermeta[user_id][key];
    }

    /** 
     * Get User Meta Value, Returns value based on user_id/key passed
     * @param {String} user_id
     * @param {String} key
     */
    LiveData.prototype.getUserMeta = function (user_id, key)
    {
        var self = this;
 
        self.log("getUserMeta > ",user_id,' > ',key);
        if (!_.isUndefined(self.usermeta[user_id]))
        {
            return self.usermeta[user_id][key];
        }
        return false;
        
    }
    
    /** 
     * Update status for user
     * @param {Object} user
     * @param {Object} status
     */
     
    LiveData.prototype.updateStatus = function (user, status)
    {
        var self = this;
        var key = user.id.toString();
        status = status || {};
        
        if (_.has(self.userlist, key))
        {
            var usr = self.userlist[key];
            _.extend(usr, {status:status});
            return usr;
        }
        return false;
    }
    
    /** 
     * Remove user from a room
     * @param {String} user_id
     */
     
    LiveData.prototype.removeUser = function (user_id)
    {
        var self = this;
        var key = user_id;
        self.log("removeUser > ",key);
        if (_.has(self.userlist, key))
        {
            self.log("removeUser > ",key," > OK");
            delete self.userlist[key];
            return true;
        }
        return false;
    }
 
    var ret = {
        LiveData: LiveData
    };
    
    return ret;
}