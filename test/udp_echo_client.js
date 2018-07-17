const dgram = require("dgram");
let socket = dgram.createSocket("udp4");

socket.on("message", (msg, rinfo) => {
    console.log("udp recv " + msg);
})

let index = 0;

setInterval(() => {
    socket.send("hello " + index++, 8080, "127.0.0.1");
}, 100);
