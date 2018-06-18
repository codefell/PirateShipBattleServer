const net = require("net");
const PromiseSocket = require("../promise_socket");

let socket = net.createConnection(8080, "127.0.0.1");
socket.on("connect", () => {
    let psock = PromiseSocket.create_promise_socket(socket);
    PromiseSocket.get_event_emitter(psock)
        .on("message", (sock, message) => {
            console.log("recv " + message);
        })
        .on("end", (sock) => {
            console.log("end");
        });
    setTimeout(() => {
        PromiseSocket.send(psock, {type:"login"});
    }, 1000)})
