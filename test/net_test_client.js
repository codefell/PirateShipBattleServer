const net = require("net");
const PromiseSocket = require("../promise_socket");

let socket = net.createConnection(8080, "127.0.0.1");
socket.on("connect", () => {
    let psock = PromiseSocket.create_promise_socket(socket);
    let index = 0;
    let timerId = 0;
    PromiseSocket.get_event_emitter(psock)
        .on("message", (sock, message) => {
            console.log("recv " + message);
        })
        .on("end", (sock) => {
            console.log("end");
            clearInterval(timerId);
        });
    timerId = setInterval(() => {
        PromiseSocket.send(psock, "index " + index++);
    }, 1000);
})
