let PhyWorld = require("../physics/world");
let Events = require("events");
//let PromiseSocket = require("../net/promise_socket");
let KcpUdpNet = require("../net/kcp_udp_socket");
let Util = require("../util");
let Process = require("process");

let next_player_id = 0;

let event_emitter = new Events();
let msg_handles = {};

function get_event_emitter() {
    return event_emitter;
}

function create_player(context) {
    let player = {context};
    KcpUdpNet.set_context_onmsg(context, (context, packet) => {
        //console.log("======== recv msg " + packet.data.toString());
        dispatch_msg(player, packet.channel, packet.data.toString());
    });
    //socket.setNoDelay(true);
    //let psock = PromiseSocket.create_promise_socket(socket);
    //player.psock = psock;
    /*
    psock.event_emitter.on("message",
        (psock, msg) => dispatch_msg(player, msg));
        */
    return player;
}

function dispatch_msg(player, channel, msg) {
    /*
    if (channel != 1) {
        console.error("unknown channel when dispatch msg");
        return;
    }
    */
    msg = JSON.parse(msg);
    try {
        msg_handles["on_" + msg.type](player, msg);
    } catch (e) {
        console.dir(e);
        console.log("on_msg exception" + e);
    }
}

function send_msg(player, msg, channel) {
    //PromiseSocket.send(player.psock, msg);
    msg['ts'] = Process.uptime();
    msg = Buffer.from(JSON.stringify(msg));
    KcpUdpNet.send(player.context, channel, msg);
}

msg_handles.on_login = (player, msg) => {
    player.id = next_player_id++;
    send_msg(player, {type: "login", id: player.id}, 1);
    event_emitter.emit("player_login", player);
}

msg_handles.on_set_vel = (player, msg) => {
    let {x: vel_x, y: vel_y} = msg;
    PhyWorld.set_vel(player.ship_id, vel_x, vel_y);
}

msg_handles.on_set_speed = (player, msg) => {
    let {speed} = msg;
    PhyWorld.set_speed(player.ship_id, speed);
}

msg_handles.on_set_angular_vel = (player, msg) => {
    let {omega} = msg;
    PhyWorld.set_angular_vel(player.ship_id, omega);
}

msg_handles.on_fire_bullet = (player, msg) => {
    console.log(JSON.stringify(msg));
    let {x, y, vx, vy, speed, radius} = msg;
    let ship_vel = PhyWorld.get_linear_vel(player.ship_id);
    console.log(`ship_vel ${ship_vel.x} ${ship_vel.y}`);
    let id = PhyWorld.add_bullet(x, y, vx, vy, ship_vel, speed, radius);
    let bullet_vel = PhyWorld.get_bullet_vel(id);
    event_emitter.emit("fire_bullet", id, x, y, bullet_vel.x, bullet_vel.y, 
        bullet_vel.Length(), radius);
}

function create_ship(player, x, y, w, h, angle) {
    player.ship_id = PhyWorld.add_body(x, y, w, h, angle);
    player.w = w;
    player.h = h;
}

function look_forward(player, forward) {
    player.look_forward = forward;
}

function get_player_info(player) {
    return {
        id: player.id,
        ship_id: player.ship_id,
        look_forward: player.look_forward,
        tfm: Object.assign({w: player.w, h: player.h},
            PhyWorld.get_body_tfm(player.ship_id))
    }
}

function start(player) {
    let msg = {
        type: "start",
    };
    send_msg(player, msg, 1);
    //PhyWorld.set_speed(player.ship_id, 2);
}

module.exports = {
    get_event_emitter,
    create_player,
    send_msg,
    create_ship,
    get_player_info,
    start,
    look_forward
}