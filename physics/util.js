function ray_cast(world, from, to) {
    let close_hit_info = {};
    let close_fraction = 1;
    let callback = (fixture, point, normal, fraction) => {
        if (fraction < close_fraction) {
            close_hit_info.body = fixture.GetBody();
            close_hit_info.point = point;
            close_hit_info.normal = normal;
            close_fraction = fraction;
        }
    }
    world.RayCast(callback, from, to);
    return close_fraction == 1 ? null : close_hit_info;
}

module.exports = {
    ray_cast
}
