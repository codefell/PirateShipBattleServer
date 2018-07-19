const EventEmitter = require("events");
const dgram = require("dgram");
const Kcp = require("./kcp_addon");

const SOCK_STATE_PENDING = 0;
const SOCK_STATE_ACK_TOKEN = 1;
const SOCK_STATE_DATA = 2;

function packet_from_buffer(buff) {
    let channel = buff[0];
    let data = buff.slice(1);
    return {channel, data};
}

function packet_to_buffer(packet) {
    let channel = packet.channel;
    let data = packet.data;
    if (typeof data == "string") {
        data = Buffer.from(data);
    }
    let buff = Buffer.allocUnsafe(1 + data.length);
    buff[0] = channel;
    data.copy(buff, 1);
    return buff;
}

let map_token_to_context = new Map();
let map_endpoint_to_context = new Map();

function accept_connection(endpoint, rinfo, token) {
    let context = map_token_to_context.get(token);
    if (context.rinfo != null) {
        kill_connection_endpoint(get_endpoint(context.rinfo));
    }
    context.rinfo = rinfo;
    for (let channel of context.kcp_channels.keys()) {
        let kcp = Kcp.kcp_create(context.conn_id * 0x100 + channel, buff => {
            let packet = packet_to_buffer({ channel, data: buff });
            server_sock.send(packet, context.rinfo.port, context.rinfo.address);
        })
        context.kcp_channels.set(channel, kcp);
    }
    map_endpoint_to_context.set(endpoint, context);
    context.sock_state = SOCK_STATE_ACK_TOKEN;
    ack_token(rinfo, context);
}

function kill_connection_endpoint(endpoint) {
    let context = map_endpoint_to_context.get(endpoint);
    context.rinfo = null;
    for (let [channel, kcp] of context.kcp_channels) {
        Kcp.kcp_release(kcp);
        context.kcp_channels.set(channel, null);
    }
    map_endpoint_to_context.delete(endpoint);
    map_token_to_context.set(context.token, context);
}

function kill_connection_token(token) {
    let context = map_token_to_context.get(token);
    kill_connection_endpoint(get_endpoint(context.info));
}

function ack_token(rinfo, context) {
    let packet = {channel:0, data:context.conn_id.toString()};
    let buff = packet_to_buffer(packet);
    server_sock.send(buff, rinfo.port, rinfo.address);
}

function get_endpoint(rinfo) {
    return `${rinfo.address}:${rinfo.port}`;
}

function on_message(data, rinfo) {
    let endpoint = get_endpoint(rinfo);
    let packet = packet_from_buffer(data);
    console.log("recv packet from " + endpoint);
    console.log(packet);
    if (!map_endpoint_to_context.has(endpoint)) {
        if (packet.channel == 0) {
            let token = packet.data.toString();
            if (map_token_to_context.has(token)) {
                console.log(`accept ${endpoint} ${rinfo.address}:${rinfo.port} ${token}`);
                accept_connection(endpoint, rinfo, token);
            }
            else {
                //ignore
                console.log("new endpoint login with non-exist token, ignore");
            }
        }
        else {
            //ignore
            console.log("new endpoint send non-login packet, ignore");
        }
    }
    else {
        let context = map_endpoint_to_context.get(endpoint);
        if (packet.channel == 0) {
            let token = packet.data.toString();
            if (token == context.token) {
                if (context.sock_state == SOCK_STATE_ACK_TOKEN) {
                    console.log("exist endpoint send login with corrent token again, "
                        + "send ack token message");
                    ack_token(rinfo, context);
                }
                else {
                    console.log("exist endpoint send login after it has sent data, "
                        + "ignore, maybe delay login message");
                }
            }
            else {
                if (map_token_to_context.has(token)) {
                    //use corresponding token change rinfo, relogin
                    //clear old context 
                    console.log("exist endpoint send other exist token rather previous, kill connection");
                    kill_connection_endpoint(endpoint);
                }
                else {
                    //kill connection and clear
                    console.log("exist endpoint send non-exist token, kill connection");
                    kill_connection_endpoint(endpoint);
                }
            }
        }
        else {
            if (context.udp_channels.has(packet.channel)) {
                context.sock_state = SOCK_STATE_DATA;
                context.onmsg(context, packet);
                //emit udp packet
            }
            else if (context.kcp_channels.has(packet.channel)) {
                console.log(`kcp ${endpoint} channel ${packet.channel} receive packet`);
                context.sock_state = SOCK_STATE_DATA;
                let kcp = context.kcp_channels.get(packet.channel);
                Kcp.kcp_input(kcp, packet.data);
                //emit kcp packet
            }
            else {
                //kill connection and clear
                console.log("receive unknown channel packet, kill connection");
                kill_connection_endpoint(endpoint);
            }
        }
    }
}

let server_sock = null;

function udp_send(buff, channel, rinfo) {
    let packet_buff = packet_to_buffer({
        channel: channel,
        data: buff
    });
    server_sock.send(packet_buff, rinfo.port, rinfo.address);
}

let conn_id = 0;
function create_context(token, udp_channels, kcp_channels, onmsg) {
    let map_kcp_channels = new Map();
    let context = {
        token,
        conn_id,
        conn_index: 0, //index of reconnection, used to diff delay login msg and relogin msg, inc 1 every time
        udp_channels: new Set(udp_channels),
        kcp_channels: map_kcp_channels,
        sock_state: SOCK_STATE_PENDING,
        onmsg
    };
    for (let c of kcp_channels) {
        map_kcp_channels.set(c, null);
    }
    map_token_to_context.set(token, context);
    conn_id++;
    return context;
}

function set_context_onmsg(context, onmsg) {
    context.onmsg = onmsg;
}

function create_server(port) {
    server_sock = dgram.createSocket("udp4");
    server_sock.on("message", on_message);
    server_sock.bind(port);
    let interval_id = setInterval(() => {
        let now = Date.now();
        for (let [token, context] of map_token_to_context) {
            if (context.sock_state == SOCK_STATE_ACK_TOKEN
                || context.sock_state == SOCK_STATE_DATA) {
                for (let [channel, kcp] of context.kcp_channels) {
                    Kcp.kcp_update(kcp, now);
                    let buffs = Kcp.kcp_recv(kcp);
                    for (let buff of buffs) {
                        context.onmsg(context, new_packet(channel, buff));
                    }
                }
            }
        }
    }, 1000 / 60);
}

/*
create_context("hello", [1, 2], [3, 4], (token, packet) => {
    let echo_msg = "udp echo " + packet.data;
    send(token, packet.channel, echo_msg);
});
create_context("world", [1, 2], [3, 4], (token, packet) => {
    let echo_msg = "kcp echo " + packet.data;
    send(token, packet.channel, echo_msg);
});

create_server(8080);
*/

function send(context, channel, msg) {
    if (typeof msg == "string") {
        msg = Buffer.from(msg);
    }
    if (context.rinfo != null) {
        if (context.kcp_channels.has(channel)) {
            let kcp = context.kcp_channels.get(channel);
            Kcp.kcp_send(kcp, msg);
        }
        else if (context.udp_channels.has(channel)) {
            udp_send(msg, channel, context.rinfo);
        }
    }
}

function new_packet(channel, data) {
    return {
        channel,
        data
    };
}

module.exports = {
    create_server,
    create_context,
    set_context_onmsg,
    send,
}
