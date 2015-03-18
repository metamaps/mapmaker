// Load required modules
var
    http    = require("http"),            // http server core module
    express = require("express"),           // web framework external module
    io      = require("socket.io"),         // web socket external module
    mapping = require("./mapping"),
    rtcSignalServer = require("./rtcSignalServer"),
    port = 5002,
    stunservers = [{"url": "stun:stun.l.google.com:19302"}];

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var httpApp = express();
httpApp.use(express.static(__dirname + "/static/"));

// Start Express http server on port 5002
var webServer = http.createServer(httpApp).listen(port);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer, { "log level": 2 });

mapping(socketServer);
rtcSignalServer(socketServer, stunservers);
