const PhyWorld = require("../physics/world");
const _ = require("../underscore");
const Player = require("./player");
const Util = require("../util");

let all_players = [];
let pending_players = new Set();

let update_timer_id = null;
let update_interval = 1000 / 60;

function init() {
    PhyWorld.init();
    Player.get_event_emitter()
        .on("player_login", player_login)
        .on("fire_bullet", fire_bullet)
        .on("broadcast_msg", broadcast_msg);
}

function broadcast_msg(msg) {
    _.each(all_players, player => {
        Player.send_msg(player, msg);
    });
}

function fire_bullet(bullet_id, x, y, vx, vy, speed, radius) {
    broadcast_msg({
        type: "fire_bullet",
        id: bullet_id,
        x, y, vx, vy, speed, radius
    });
}

function create_player(socket) {
    let player = Player.create_player(socket);
    pending_players.add(player);
}

let look_forward = true;

function player_login(player) {
    //console.log("player login " + player.id);
    let x = Util.rand_int(-20, 20);
    let y = Util.rand_int(-20, 20);
    let w = 3.32, h = 5.88, angle = 0;
    angle = look_forward ? 0 : Math.PI;
    Player.create_ship(player, x, y, w, h, angle);
    Player.look_forward(player, look_forward);
    look_forward = !look_forward;
    let players_info = [];
    players_info.push(Player.get_player_info(player));
    console.dir(players_info);
    _.each(all_players, _.partial(send_players_ready, _, players_info));

    pending_players.delete(player);
    all_players.push(player);

    players_info = _.map(all_players, Player.get_player_info);
    send_players_ready(player, players_info);

    if (all_players.length == 2) {
        start_game();
    }
}

function send_players_ready(player, ready_players) {
    let msg = {
        type: "players_ready",
        players: ready_players
    };
    Player.send_msg(player, msg);
}

function start_game() {
    PhyWorld.run();
    _.each(all_players, Player.start);
    update_timer_id = setInterval(() => {
        update();
    }, update_interval);
}

function broadcast_msg(msg) {
    _.each(all_players, player => {
        Player.send_msg(player, msg);
    })
}

function on_bullet_event(evt) {
    let {hit_event, stop_event} = evt;
    if (hit_event.length > 0) {
        _.each(hit_event, evt_info => {
            let {bullet_id, hit_event: {body, point, normal}} = evt_info;
            let body_id = PhyWorld.get_body_id(body);
            let msg = {
                type: "bullet_hit",
                bullet_id,
                body_id,
                x: point.x,
                y: point.y
            };
            broadcast_msg(msg);
            PhyWorld.remove_bullet(bullet_id);
            console.log(`hit info ${bullet_id} ${body_id} ${point.x} ${point.y}`);
        });
    }
    if (stop_event.length > 0) {
        _.each(stop_event, evt_info => {
            let {bullet_id} = evt_info;
            PhyWorld.remove_bullet(bullet_id);
            console.log("Bullet stop " + bullet_id);
        })
    }
}

function update() {
    let world_info = PhyWorld.get_world_info();
    let msg = {type:"world_info", world_info};
    _.each(all_players, player => {
        Player.send_msg(player, msg);
    });
    evts = PhyWorld.fetch_events();
    _.each(evts, evt => {
        if (evt["bullet_event"]) {
            on_bullet_event(evt["bullet_event"]);
        }
    })
}

init();

module.exports = {
    create_player
}

