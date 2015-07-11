var express = require('express.io');

//Namespace
var app = {};

app.constants = require('./constants');
app._ = require('underscore');

//Init Mongoose Models
var m = require('./components/models.js')(app);
app.models = m.models;
app.schema = m.schema;


//Init Components
app.auth = require('./components/auth')(app);
app.files = require('./components/files')(app);
app.videos = require('./components/video')(app);
app.user = require('./components/user')(app);
app.room = require('./components/room')(app);
app.chat = require('./components/chat')(app);
app.player = require('./components/player')(app);
app.livedata = require('./components/livedata')(app);
app.playlist = require('./components/playlist')(app);


/*
 *  TODO: Move data structures to Redis
 */
app.rooms = {};

app.server = express();

//Setup HTTP Server, need to add https() for SSL support
app.web = app.server.http().io();
app.io = app.server.io;


//Configure Express
app.web.configure(
    function(){
        app.web.use(express.static(app.constants.CLIENT_PATH));
        app.web.use(express.cookieParser());
        app.web.use(express.bodyParser());
        app.web.use(express.session({secret: app.constants.SESSION_SECRET}));
        app.web.use(app.auth.passport.initialize());
        app.web.use(app.auth.passport.session());
});

//Passport Auth: Configure Facebook Auth
// TODO: Add more strategies for authentication
app.auth.passport.serializeUser(app.auth.f_serializeUser);
app.auth.passport.deserializeUser(app.auth.f_deserializeUser);
app.auth.passport.use(app.auth.fbStrategy);

var handleEvent = function(req)
{
    console.log("Handle event ", req.data);
}


//Passport Auth: Setup Routes 
app.web.get('/api/auth/facebook', app.auth.passport.authenticate('facebook'));
app.web.get('/api/auth/logout', app.auth.logout);
app.web.get('/api/auth/facebook/callback', app.auth.passport.authenticate('facebook', {successRedirect: '#/account/profile', failureRedirect: '#/account/error' }));

//Rooms: Setup Event Handlers
app.io.route('ready', app.room.joinRoom);
app.io.route('join', app.room.joinRoom);
app.io.route('leave', app.room.leaveRoom);
app.io.route('chat', app.chat);
app.io.route('player', app.player);

app.io.sockets.on('connection', function(socket) {
    socket.on('disconnect', function() {
    var user_id;
       // this returns a list of all rooms this user is in
       if (typeof app.io.handshaken[socket.id].session.passport !== "undefined")
        {
            console.log(app.io.handshaken[socket.id].session.passport);
            user_id = app.io.handshaken[socket.id].session.passport.user;
            app.room.leaveRooms(null, user_id);
            console.log("Disconnecting from ",socket.id, "  ", user_id);
        }
    });
})



app.io.route('connected', function(req) {
  console.warn('io.route.connect');
  }
)




//Configure Socket IO
app.io.set('resource', '/api/socket');
app.io.set('browser client minification', true); 

//Setup HTTP API Routes
app.web.get('/api/room/:room_id', app.room.getRoomByID);
app.web.get('/api/rooms',  app.room.getRooms);
app.web.get('/api/room/:room_id/playlist', app.playlist.list);

app.web.get('/api/s3buckets/', app.files.getS3Buckets);

app.web.get('/api/videos', app.videos.findVideos);
app.web.get('/api/video/:video_id',  app.videos.findVideo);
app.web.get('/api/convert/:video_id',  app.videos.convertVideo);

app.web.get('/api/user', app.user.findUser);
app.web.get('/api/user/:id', app.user.findUser);

app.web.post('/api/upload',  app.files.uploadFile);

app.web.get('/api/auth/status', app.auth.status);

console.log("Done with deps");

app.web.listen(app.constants.PORT || 80, app.constants.HOSTNAME || 'localhost',  function() {
  console.log('%s listening at %s', app.web.name, app.constants.PORT || 80, app.constants.HOSTNAME || 'localhost');
});
