let _ = require("./underscore");

function rand_int(lower, upper) {
    return Math.floor(lower + Math.random() * (upper - lower));
}

function time() {
    return (new Date()).getTime() / 1000;
}

function insert_list(list, e) {
    let i = _.indexOf(list, undefined);
    if (i < 0) {
        i = list.length;
    }
    list[i] = e;
    return i;
}

module.exports = {
    rand_int,
    time,
    insert_list
}
