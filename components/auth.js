/**
 * Auth module. 
 * 
 * Authentication module for Auth
 * 
 * @module auth/auth
 */
 
var passport = require('passport');
var FacebookStrategy = require('passport-facebook');

module.exports = function(app)
{
    var constants = app.constants;
    
    /**
     * Status function, returns JSON with most up to date status
     * 
     * @param {Object} req
     * @param {Object} res
     */
    var status = function(req, res){
        var user = getUser(req, res);
        res.json({
                success: (user !== false),
                user: user
        });
    };
    
    /**
     * Error function, returns JSON with auth error
     * 
     * @param {Object} req
     * @param {Object} res
     * @param {Function} next
     */
    var error = function(req, res, next)
    {
        res.json({
                success:false
        });
    }
    
    /**
     * f_serializeUser - Serialize user information to store for Passport
     * 
     * @param {Object} req
     * @param {Object} res
     * @param {Function} next
     */
    var f_serializeUser = function (user, done, app) {
        done(null, user.id);
    };
    
    /**
     * f_deserializeUser - Deserialize user information for Passport
     * 
     * @param {String} id
     * @param {Function} done - Callback function
     */
    var f_deserializeUser = function (id, done) {
        app.models.User.findOne({id:id}, function(err, user){
            done(err, user);
        });
    };
    
    /**
     * getUser - Deserialize user information for Passport
     * 
     * @param {String} id
     * @param {Function} done - Callback function
     */
    var getUser = function(req, res, next)
    {
                
        if (req && req.session && req.session.passport && typeof req.session.passport.user!=="undefined")
        {
            var user_id = req.session.passport.user;
            
            if (typeof next=="function")
            {
                next(req, res, user_id);
            }
            
            return user_id;
        }
        else
        {
            if (typeof next=="function")
            {
                next(req, res, false);
            }
            return false;
        }
        
    }
    
    var fbStrategy = new FacebookStrategy({
        clientID: constants.FACEBOOK_APP_ID,
        clientSecret: constants.FACEBOOK_APP_SECRET,
        callbackURL: constants.APPLICATION_URL+"/api/auth/facebook/callback"
      },
      function(accessToken, refreshToken, profile, done) {
        console.log(app.models);
        app.models.User.findOne({id: profile.id}, function(err, existing) {
            if (existing!==null && existing.id)
            {
                console.log("Found existing user ", existing.id);
            }
            else
            {
                console.log("New user found ", profile.id);
                app.models.User.create(profile, function(err, newuser){
                    console.log("Created user ", newuser._id);
                    done(err, profile);
                });
            }
        })
        
        return done(null, profile);
      }
    )

    
    var logout = function(req, res)
    {
        var user_id = app.auth.getUser(req, res);
        app.room.leaveRooms(req, user_id);
        req.logout();
        res.redirect('#/account/logout');
    }

var exp = {};
exp.passport = passport;
exp.f_serializeUser = f_serializeUser;
exp.f_deserializeUser = f_deserializeUser;
exp.fbStrategy = fbStrategy;
exp.error = error;
exp.status = status;
exp.getUser = getUser;
exp.logout = logout;
return exp;

}