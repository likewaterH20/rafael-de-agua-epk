# Preview server for the desktop app's Browser pane. The pane's process cannot read the project path,
# so: rsync the project to <scratchpad>/site, copy this file next to it, and point launch.json at the copy.
import http.server, socketserver, socket, os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"site")
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**k): super().__init__(*a,directory=ROOT,**k)
    def end_headers(self):
        self.send_header("Cache-Control","no-store"); super().end_headers()
class V6(socketserver.ThreadingTCPServer):
    address_family=socket.AF_INET6; allow_reuse_address=True; daemon_threads=True
    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0); super().server_bind()
with V6(("::",4520),H) as s: s.serve_forever()
