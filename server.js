const net = require("net");
const game_world = require("./game_world/game_world");

net.createServer(socket => {
    game_world.create_player(socket);
}).listen(8080);

