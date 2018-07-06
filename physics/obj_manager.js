let Util = require("../util");
let _ = require("../underscore");

function new_manager() {
    return {
        next_id: 0,
        map: new Map()
    };
}

function add(manager, obj) {
    let id = manager.next_id++;
    manager.map.set(id, obj);
    return id;
}

function get(manager, id) {
    return manager.map.get(id);
}

function remove_id(manager, id) {
    manager.map.delete(id);
}

function remove_obj(manager, obj) {
    let key = null;
    for (let [k, v] of manager.map.entries()) {
        if (v == obj) {
            key = k; 
            break;
        }
    }
    if (key) {
        remove_id(key);
    }
}

function foreach(manager, callback) {
    manager.map.forEach(callback);
}

module.exports = {
    new_manager,
    add,
    get,
    remove_id,
    remove_obj,
    foreach
}