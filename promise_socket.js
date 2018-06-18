const PromiseDuplex = require("promise-duplex").PromiseDuplex;
const EventEmitter = require("events");

function create_promise_socket(socket) {
    let psock = {};
    psock.promise_socket = new PromiseDuplex(socket);
    psock.send_buf = [];
    psock.pending_wait_msg_promise = null;
    psock.send_co_exit = false;
    psock.recv_co_exit = false;
    psock.event_emitter = new EventEmitter();
    _send_co(psock);
    _recv_co(psock);
    return psock;
}

function get_event_emitter(psock) {
    return psock.event_emitter;
}

function send(psock, msg) {
    if (typeof msg == "object") {
        msg = JSON.stringify(msg);
    }
    //console.log("send " + msg);
    if (psock.pending_wait_msg_promise) {
        let promise_info = psock.pending_wait_msg_promise;
        promise_info.resolve(msg);
        psock.pending_wait_msg_promise = null;
    }
    else {
        psock.send_buf.push(msg);
    }
}

async function _recv_msg(psock) {
    const head = await psock.promise_socket.read(4);
    let len = head.readInt32BE(0);
    const body = await psock.promise_socket.read(len);
    return body.toString("utf8");
}

async function _recv_co(psock) {
    try {
        while (true) {
            let msg = await _recv_msg(psock);
            psock.event_emitter.emit("message", psock, msg);
        }
    }
    catch (e) {
        //console.dir(socket._writableState.ended);
        //console.dir(socket.destroyed);
        //console.log(e);
        console.log("recvCo exit ");
        if (psock.pending_wait_msg_promise) {
            psock.pending_wait_msg_promise.reject();
        }
        psock.recv_co_exit = true;
        check_end(psock);
    }
}

function _fetch_msg(psock) {
    if (psock.send_buf.length > 0) {
        return psock.send_buf.shift();
    }
    else {
        return new Promise((resolve, reject) => {
            psock.pending_wait_msg_promise = { resolve, reject };
        });
    }
}

function _packet(msg) {
    let len = Buffer.byteLength(msg);
    let packet = Buffer.alloc(len + 4);
    packet.writeInt32BE(len);
    packet.write(msg, 4);
    return packet;
}

async function _send_co(psock) {
    try {
        while (true) {
            let msg = await _fetch_msg(psock);
            //console.log("send " + msg);
            await psock.promise_socket.write(_packet(msg));
        }
    }
    catch (e) {
        //console.log(e);
        console.log("sendCo exit ");
        psock.send_co_exit = true;
        check_end(psock);
    }
}

function check_end(psock) {
    if (psock.send_co_exit && psock.recv_co_exit) {
        psock.event_emitter.emit("end", psock);
    }
}

module.exports = {
    create_promise_socket,
    send,
    get_event_emitter
}