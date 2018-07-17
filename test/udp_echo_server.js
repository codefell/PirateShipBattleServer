const dgram = require("dgram");
let socket = dgram.createSocket("udp4");

socket.on("message", (msg, rinfo) => {
    console.log("udp recv " + msg);
    socket.send("echo " + msg, rinfo.port, rinfo.address);
})

socket.bind(8080, () => {
    console.log(`bind complete`);
    console.dir(socket.address());
});