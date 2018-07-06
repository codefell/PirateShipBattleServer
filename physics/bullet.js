let Util = require("../util");
let PhyUtil = require("./util");
let ObjManager = require("./obj_manager");
let Box2D = require("./Box2D").Box2D;

let {
    b2Vec2
} = Box2D.Common.Math;

function set_id(bullet, id) {
    bullet.id = id;
}

function get_id(bullet) {
    return bullet.id;
}

function get_bullet_vel(bullet) {
    return bullet.vel;
}

function update_bullet(world, bullet, ts) {
    ts = ts || til.time();
    let hit_event = null;
    let stop_event = null;
    if (bullet.distance < bullet.radius) {
        let travel = bullet.vel.Copy();
        travel.Multiply(ts - bullet.last_ts);
        let to_pos = bullet.pos.Copy();
        to_pos.Add(travel);
        let close_hit_info = PhyUtil.ray_cast(world, bullet.pos, to_pos);
        if (close_hit_info) {
            hit_event = close_hit_info;
        }
        bullet.pos = to_pos;
        bullet.distance += travel.Length();
        bullet.last_ts = ts;
        if (bullet.distance >= bullet.radius) {
            stop_event = true;
        }
    }
    return {hit_event, stop_event};
}

function update_bullet_manager(world, manager) {
    let ts = Util.time();
    let hit_event = [];
    let stop_event = []; 

    ObjManager.foreach(manager, (bullet) => {
        let evt = update_bullet(world, bullet, ts);
        let bullet_id = get_id(bullet);
        if (evt.hit_event) {
            hit_event.push({
                bullet_id,
                hit_event: evt.hit_event
            });
        }
        if (evt.stop_event) {
            stop_event.push({
                bullet_id
            });
        }
    })
    if (hit_event.length > 0 || stop_event.length > 0) {
        return {hit_event, stop_event};
    }
    return null;
}

function new_bullet(x, y, vx, vy, extra_vel, speed, radius) {
    let vel = new b2Vec2(vx, vy);
    vel.Normalize();
    vel.Multiply(speed);
    if (extra_vel != null) {
        console.log(`add ship vel ${extra_vel.x} ${extra_vel.y}`);
        console.log(`before bullet vel ${vel.x} ${vel.y}`);
        vel.Add(extra_vel);
        console.log(`after bullet vel ${vel.x} ${vel.y}`);
    }
    let bullet = {
        pos: new b2Vec2(x, y),
        vel,
        distance: 0,
        radius,
        last_ts: Util.time()
    };
    return bullet;
}

module.exports = {
    update_bullet,
    update_bullet_manager,
    new_bullet,
    get_id,
    set_id,
    get_bullet_vel
};