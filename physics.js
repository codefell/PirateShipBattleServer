var m = require('./Box2D');
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
    var gravity = new b2Vec2(0, -9.8);
    var do_sleep = true;
    let world = new b2World(gravity, do_sleep);
    world_ctx.world = world;
    world_ctx.bodies = [];
    let ground = make_rect_body(0, -0.5, 30, 1, 0, b2Body.b2_staticBody);
}

function set_vel(id, vx, vy) {
    world_ctx.bodies[id].SetAwake(true);
    world_ctx.bodies[id].SetLinearVelocity(new b2Vec2(vx, vy));
}

function add_body(x, y, w, h, angle) {
    let id = next_body_id++;
    world_ctx.bodies[id] = make_rect_body(x, y, w, h, angle, b2Body.b2_dynamicBody);
    return id;
}

function run() {
    world_ctx.run_timer_id = setInterval(() => {
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

module.exports = {
    init, add_body, get_body_tfm, run, get_world_info,
    stop, clear, debug_info, set_vel
}
