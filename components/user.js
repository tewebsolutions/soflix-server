/**
 * User module.
 * @module components/user
 */
module.exports = function(app)
{
    /** 
     * getRooms - WS Wrapper around Mongoose Call
     * @param {Object} req 
     * @param {Object} res
     * @param {Function} next
     */
    var findUser = function(req, res){
        var user_id = app.auth.getUser(req, res);
        console.log("Fetching user ", user_id);
        if (user_id !== false)
            {
                app.models.User.findOne({id: user_id}, function(err, existing) {
                    
                    console.log("Found user ", user_id, " ", existing.id);
                    
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
                console.log("Not found user ", user_id);
                var msg = {status:false, error:"unauthorized"};
                 res.json(msg);
            }
    };
    
    var ret = {
        findUser: findUser
    };
    return ret;
}