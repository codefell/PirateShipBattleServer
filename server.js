const net = require("net");
const GameWorld = require("./game/world");

net.createServer(socket => {
    GameWorld.create_player(socket);
}).listen(8080, "127.0.0.1");

