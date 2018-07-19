let KcpUdpSock = require("../net/kcp_udp_socket");

KcpUdpSock.create_server(8080);
KcpUdpSock.create_context("hello", [1, 2], [3, 4], (context, packet) => {
    if (packet.channel == 1 || packet.channel == 2) {
        KcpUdpSock.send(context, packet.channel, "udp echo " + packet.data);
    }
    else {
        KcpUdpSock.send(context, packet.channel, "kcp echo " + packet.data);
    }
});

KcpUdpSock.create_context("world", [1, 2], [3, 4], (context, packet) => {
    if (packet.channel == 1 || packet.channel == 2) {
        KcpUdpSock.send(context, packet.channel, "udp echo " + packet.data);
    }
    else {
        KcpUdpSock.send(context, packet.channel, "kcp echo " + packet.data);
    }
});