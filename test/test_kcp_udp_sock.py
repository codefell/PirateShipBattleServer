import struct
import socket
import sys

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
addr = ("127.0.0.1", 8080)

for line in map(str.strip, sys.stdin):
    channel, payload = line.split(" ")
    channel = int(channel)
    payload = payload.encode("utf-8")
    packet = struct.pack("b%ds" % len(payload), channel, payload)
    sock.sendto(packet, addr)