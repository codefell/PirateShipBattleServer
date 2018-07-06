const net = require("net");
const PromiseSocket = require("../net/promise_socket");

let socket = net.createConnection(8080, "127.0.0.1");
socket.on("connect", () => {
    let psock = PromiseSocket.create_promise_socket(socket);
    PromiseSocket.get_event_emitter(psock)
        .on("message", (sock, message) => {
            let json = JSON.parse(message);
            if (json["type"] != "world_info") {
                console.log("recv " + message);
            }
        })
        .on("end", (sock) => {
            console.log("end");
        });
    setTimeout(() => {
        PromiseSocket.send(psock, {type:"login"});
    }, 1000);
    setTimeout(() => {
        PromiseSocket.send(psock, {
            type: "fire_bullet",
            x: 5,
            y: 5,
            vx: -3,
            vy: -6,
            speed: 2,
            radius: 6
        })
    }, 2000);
});
