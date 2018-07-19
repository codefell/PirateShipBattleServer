/*
const net = require("net");
const GameWorld = require("./game/world");

net.createServer(socket => {
    GameWorld.create_player(socket);
}).listen(8080, "127.0.0.1");
*/
const Express = require("express");
const BodyParser = require("body-parser");
const UUID = require("node-uuid");
const KcpUdpNet = require("./net/kcp_udp_socket");
const GameWorld = require("./game/world");
const app = Express();

app.use(BodyParser.urlencoded({extended: true}));
app.use(BodyParser.json());

const router = Express.Router();
router.put("/login", (req, res) => {
    console.log(req.body);
    token = UUID.v1();
    let context = KcpUdpNet.create_context(token, [], [1], null);
    GameWorld.create_player(context);
    res.json({token});
});

app.use("/api", router);

app.listen(8080);

KcpUdpNet.create_server(8080);
