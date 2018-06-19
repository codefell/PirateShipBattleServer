const phy_world = require("../physics")
const _ = require("../underscore");
const Player = require("./player");

let all_players = [];
let pending_players = new Set();

let update_timer_id = null;
let update_interval = 1000 / 60;

function init() {
    phy_world.init();
    Player.get_event_emitter()
        .on("player_login", player_login)
        .on("broadcast_msg", broadcast_msg);
}

function create_player(socket) {
    let player = Player.create_player(socket);
    pending_players.add(player);
}

function player_login(player) {
    //console.log("player login " + player.id);
    let x = 0, y = 5, w = 1, h = 3, angle = Math.PI / 4;
    Player.create_ship(player, x, y, w, h, angle);
    let players_info = [];
    players_info.push(Player.get_player_info(player));
    _.each(all_players, _.partial(send_players_ready, _, players_info));

    pending_players.delete(player);
    all_players.push(player);

    players_info = _.map(all_players, Player.get_player_info);
    send_players_ready(player, players_info);

    if (all_players.length == 1) {
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
    phy_world.run();
    _.each(all_players, Player.start);
    update_timer_id = setInterval(() => {
        update();
    }, update_interval);
}

function broadcast_msg(msg) {
    _.each(all_players, player => {
        send_msg(player, msg);
    })
}

function update() {
    let world_info = phy_world.get_world_info();
    let msg = {type:"world_info", world_info};
    _.each(all_players, player => {
        Player.send_msg(player, msg);
    });
}

init();

module.exports = {
    create_player
}

