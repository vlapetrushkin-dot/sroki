"""Локальный сервер для разработки.

Отличается от `python -m http.server` одним: запрещает кеширование.
Штатный http.server не шлёт Cache-Control, и браузер по своей эвристике
держит в кеше файлы, подключённые через @import, — правки CSS не доезжают
без ручного сброса кеша.

Запуск:  python dev-server.py [порт]
Для продакшена не нужен: на хостинге раздаются статические файлы как есть.
"""

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Тише стандартного: только метод, путь и код.
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    server = ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler)
    print("dev-server: http://localhost:%d  (Ctrl+C — остановить)" % port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\ndev-server: остановлен")
        server.server_close()


if __name__ == "__main__":
    main()
