#!/usr/bin/env python3
"""Development static server for Doodle Shooter.

The server supports local-only development and LAN access. It keeps source files
uncached for rapid iteration, while allowing vendor libraries to be cached so LAN
clients do not repeatedly download large dependencies such as three.module.js.
"""
from __future__ import annotations

import argparse
import http.server
import os
import socket
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DEFAULT_PORT = 8765


class DoodleServer(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True
    allow_reuse_address = True


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        path = self.path.split('?', 1)[0]
        if path.startswith('/vendor/'):
            self.send_header('Cache-Control', 'public, max-age=3600')
        else:
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt: str, *args: object) -> None:
        client = self.client_address[0] if self.client_address else '-'
        sys.stderr.write(f'{client} - {fmt % args}\n')


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Serve Doodle Shooter static files.')
    parser.add_argument('port_arg', nargs='?', type=int, help='port number, kept for backwards compatibility')
    parser.add_argument('--port', type=int, help='port number')
    parser.add_argument('--host', default='127.0.0.1', help='host to bind, default: 127.0.0.1')
    parser.add_argument('--lan', action='store_true', help='bind 0.0.0.0 so other LAN devices can access the game')
    args = parser.parse_args(argv)
    args.port = args.port or args.port_arg or DEFAULT_PORT
    if args.lan:
        args.host = '0.0.0.0'
    if args.port < 1 or args.port > 65535:
        parser.error('port must be between 1 and 65535')
    return args


def local_ip() -> str | None:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(('8.8.8.8', 80))
            return str(sock.getsockname()[0])
    except OSError:
        return None


def print_startup(host: str, port: int) -> None:
    print(f'Serving {ROOT}')
    print(f'Listening on {host}:{port}')
    print(f'Local: http://127.0.0.1:{port}')
    if host == '0.0.0.0':
        ip = local_ip()
        if ip:
            print(f'LAN:   http://{ip}:{port}')
        else:
            print('LAN:   use your computer LAN IP with this port')
        print('If LAN clients cannot connect, check firewall and Wi-Fi client isolation.')


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    os.chdir(ROOT)
    server = DoodleServer((args.host, args.port), Handler)
    print_startup(args.host, args.port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped')
    finally:
        server.server_close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
