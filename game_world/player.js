let PhyWorld = require("../physics");
let Events = require("events");
let PromiseSocket = require("../promise_socket");

let next_player_id = 0;

let event_emitter = new Events();
let msg_handles = {};

function get_event_emitter() {
    return event_emitter;
}

function create_player(socket) {
    socket.setNoDelay(true);
    let psock = PromiseSocket.create_promise_socket(socket);
    let player = {};
    player.psock = psock;
    psock.event_emitter.on("message",
        (psock, msg) => dispatch_msg(player, msg));
    return player;
}

function dispatch_msg(player, msg) {
    msg = JSON.parse(msg);
    try {
        msg_handles["on_" + msg.type](player, msg);
    } catch (e) {
        console.log("on_msg exception" + e);
    }
}

function send_msg(player, msg) {
    PromiseSocket.send(player.psock, msg);
}

msg_handles.on_login = (player, msg) => {
    player.id = next_player_id++;
    send_msg(player, {type: "login", id: player.id});
    event_emitter.emit("player_login", player);
}

msg_handles.on_set_vel = (player, msg) => {
    let {x: vel_x, y: vel_y} = msg;
    PhyWorld.set_vel(player.ship_id, vel_x, vel_y);
}

function create_ship(player, x, y, w, h, angle) {
    player.ship_id = PhyWorld.add_body(x, y, w, h, angle);
    player.w = w;
    player.h = h;
}

function get_player_info(player) {
    return {
        id: player.id,
        ship_id: player.ship_id,
        tfm: Object.assign({w: player.w, h: player.h},
            PhyWorld.get_body_tfm(player.ship_id))
    }
}

function start(player) {
    let msg = {
        type: "start"
    };
    send_msg(player, msg);
}

module.exports = {
    get_event_emitter,
    create_player,
    send_msg,
    create_ship,
    get_player_info,
    start
}