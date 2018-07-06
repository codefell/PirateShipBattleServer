const net = require("net");
const PromiseSocket = require("../net/promise_socket");
const Util = require("../util");

net.createServer(socket => {
    let psock = PromiseSocket.create_promise_socket(socket);
    PromiseSocket.get_event_emitter(psock).on("message", (sock, message) => {
	console.log("recv msg " + message);
	message = "echo " + message;
	PromiseSocket.send(psock, message);
    });
}).listen(8080, "192.168.1.118");
