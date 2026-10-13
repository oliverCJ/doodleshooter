#!/usr/bin/env python3
from __future__ import annotations

import concurrent.futures
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESOURCES = [
    '/',
    '/src/main.js',
    '/src/effects.js',
    '/vendor/three/three.module.js',
    '/vendor/peerjs/peerjs.min.js',
]


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(('127.0.0.1', 0))
        return int(sock.getsockname()[1])


def wait_until_ready(port: int, proc: subprocess.Popen[str]) -> None:
    deadline = time.time() + 8
    last_error: Exception | None = None
    while time.time() < deadline:
        if proc.poll() is not None:
            stdout, stderr = proc.communicate(timeout=1)
            raise RuntimeError(f'serve.py exited early\nstdout:\n{stdout}\nstderr:\n{stderr}')
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/', timeout=1) as response:
                if response.status == 200:
                    return
        except Exception as exc:
            last_error = exc
        time.sleep(0.1)
    raise RuntimeError(f'serve.py did not become ready: {last_error}')


def fetch(port: int, path: str) -> tuple[str, int, int, str]:
    url = f'http://127.0.0.1:{port}{path}'
    with urllib.request.urlopen(url, timeout=5) as response:
        body = response.read()
        cache_control = response.headers.get('Cache-Control', '')
        return path, int(response.status), len(body), cache_control


def main() -> int:
    port = free_port()
    proc = subprocess.Popen(
        [sys.executable, 'serve.py', '--host', '127.0.0.1', '--port', str(port)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    try:
        wait_until_ready(port, proc)
        jobs = RESOURCES * 12
        with concurrent.futures.ThreadPoolExecutor(max_workers=24) as executor:
            results = list(executor.map(lambda item: fetch(port, item), jobs))

        for path, status, size, cache_control in results:
            if status != 200:
                raise AssertionError(f'{path} returned HTTP {status}')
            if size <= 0:
                raise AssertionError(f'{path} returned an empty body')
            if path.startswith('/vendor/') and 'max-age' not in cache_control:
                raise AssertionError(f'{path} should be cacheable, got Cache-Control={cache_control!r}')

        print('OK: static server health check passed')
        return 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=3)


if __name__ == '__main__':
    raise SystemExit(main())
