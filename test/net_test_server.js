const net = require("net");
const PromiseSocket = require("../promise_socket");

net.createServer(socket => {
    let psock = PromiseSocket.create_promise_socket(socket);
    PromiseSocket.get_event_emitter(psock).on("message", (sock, message) => {
        console.log("recv msg " + message);
        message = "echo " + message;
        PromiseSocket.send(psock, message);
    });
}).listen(8080);
