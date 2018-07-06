const m = require('./Box2D');
const Util = require("./util");
const ObjManager = require("./obj_manager");
const Bullet = require("./bullet");

Box2D = m.Box2D;
var b2Vec2 = Box2D.Common.Math.b2Vec2
,   b2_pi = Box2D.Common.b2Settings.b2_pi
,   b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef
,   b2RevoluteJoint = Box2D.Dynamics.Joints.b2RevoluteJoint
,   b2AABB = Box2D.Collision.b2AABB
,	b2BodyDef = Box2D.Dynamics.b2BodyDef
,	b2Body = Box2D.Dynamics.b2Body
,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
,	b2Fixture = Box2D.Dynamics.b2Fixture
,	b2World = Box2D.Dynamics.b2World
,	b2MassData = Box2D.Collision.Shapes.b2MassData
,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
,   b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
;

let next_body_id = 0;

function make_rect_body(x, y, w, h, angle, dynamic_type) {
    var body_def = new b2BodyDef;
    //bodyDef.type = b2Body.b2_dynamicBody;
    body_def.type = dynamic_type;
    body_def.position.Set(x, y);
    body_def.angle = angle;
    var fix_def = new b2FixtureDef;
    fix_def.shape = new b2PolygonShape;
    fix_def.shape.SetAsBox(w/2, h/2);
    fix_def.density = 1;
    fix_def.friction = 0.3;
    fix_def.restitution = 0.5;

    var body = world_ctx.world.CreateBody(body_def);
    body.CreateFixture(fix_def);
    body.ResetMassData();

    return body;
}

function make_circle_body(x, y, r, dynamic_type) {
    var bodyDef = new b2BodyDef;
    body_def.type = dynamic_type;
    body_def.position.Set(x, y);
    var body = world_ctx.world.CreateBody(body_def);
    var fix_def = new b2FixtureDef;
    fix_def.shape = new b2CircleShape(r);
    fix_def.density = 1;
    fix_def.friction = 0.3;
    fix_def.restitution = 0.5;
    body.CreateFixture(fix_def);
    return body;
}

let world_ctx = {};

function init() {
    var gravity = new b2Vec2(0, 0);
    var do_sleep = true;
    let world = new b2World(gravity, do_sleep);
    world_ctx.world = world;
    world_ctx.bodies = [];
    world_ctx.bullet_manager = ObjManager.new_manager();
    world_ctx.events = [];
    //let ground = make_rect_body(0, -0.5, 30, 1, 0, b2Body.b2_staticBody);
}

function set_speed(id, speed) {
    let body = world_ctx.bodies[id];
    if (speed > 0) {
        body.SetAwake(true);
    }
    body.speed = speed;
}

function set_vel(id, vx, vy) {
    world_ctx.bodies[id].SetAwake(true);
    world_ctx.bodies[id].SetLinearVelocity(new b2Vec2(vx, vy));
}

function set_angular_vel(id, omega) {
    world_ctx.bodies[id].SetAwake(true);
    world_ctx.bodies[id].SetAngularVelocity(omega);
}

function add_body(x, y, w, h, angle) {
    let id = next_body_id++;
    console.log("add body " + id);
    let body = make_rect_body(x, y, w, h, angle, b2Body.b2_dynamicBody);
    body.id = id;
    body.speed = 0;
    world_ctx.bodies[id] = body;
    return id;
}

let forward = new b2Vec2(0, 1);

function update_body() {
    for (let body of world_ctx.bodies) {
        let vel = body.GetWorldVector(forward);
        vel.Multiply(body.speed);
        if (!body.IsAwake()) {
            body.SetAwake(true);
        }
        body.SetLinearVelocity(vel);
    }
}

function update_bullet() {
    let bullet_event = Bullet.update_bullet_manager(world_ctx.world,
        world_ctx.bullet_manager);
    if (bullet_event) {
        world_ctx.events.push({
            bullet_event
        });
    }
}

function fetch_events() {
    let events = world_ctx.events;
    world_ctx.events = [];
    return events;
}

function run() {
    world_ctx.run_timer_id = setInterval(() => {
        update_body();
        update_bullet();
        world_ctx.world.Step(1 / 60, 6, 2);
    }, 1000/60);
}

function get_body_tfm(id) {
    var body = world_ctx.bodies[id];
    var pos = body.GetPosition();
    var angle = body.GetAngle();
    return {x: pos.x, y: pos.y, angle};
}

function get_world_info() {
    let info = [];
    for (let [id, body] of world_ctx.bodies.entries()) {
        var pos = body.GetPosition();
        var angle = body.GetAngle();
        info.push({id, tfm: {x: pos.x, y: pos.y, angle}});
    }
    return info;
}

function stop() {
    clearInterval(world_ctx.run_timer_id);
}

function clear() {
    for (let body of world_ctx.bodies) {
        world_ctx.world.DestroyBody(body);
    }
    world_ctx.bodies.length = [];
}

function debug_info() {
    let body_count = world_ctx.world.GetBodyCount();
    //let body_list = world_ctx.world.GetBodyList;
    let info = {};
    info.count = body_count;
    return info;
}

function add_bullet(x, y, vx, vy, extra_vel, speed, radius) {
    let bullet = Bullet.new_bullet(x, y, vx, vy, extra_vel, speed, radius);
    let id = ObjManager.add(world_ctx.bullet_manager, bullet);
    Bullet.set_id(bullet, id);
    return id;
}

function get_bullet_vel(id) {
    let bullet = ObjManager.get(world_ctx.bullet_manager, id);
    return Bullet.get_bullet_vel(bullet);
}

function remove_bullet(id) {
    ObjManager.remove_id(world_ctx.bullet_manager, id);
}

function get_body_id(body) {
    return body.id;
}

function get_linear_vel(body_id) {
    return world_ctx.bodies[body_id].GetLinearVelocity();
}

module.exports = {
    init, add_body, get_body_tfm, run, get_world_info,
    stop, clear, debug_info, set_vel, set_angular_vel,
    set_speed, add_bullet, remove_bullet, fetch_events,
    get_body_id, get_linear_vel, get_bullet_vel
}
