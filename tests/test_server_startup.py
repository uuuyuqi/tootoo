"""Network-independent regression for the HTTP server's loopback bind."""
from unittest import TestCase
from unittest.mock import patch
from server import TooTooServer, TooTooHandler

class ServerStartupTests(TestCase):
    def test_loopback_server_binds_without_reverse_dns(self):
        with patch("socket.getfqdn", side_effect=AssertionError("no reverse DNS in listen path")):
            with TooTooServer(("127.0.0.1", 0), TooTooHandler) as server:
                self.assertEqual(server.server_name, "127.0.0.1")
                self.assertEqual(server.server_port, server.server_address[1])
                self.assertGreater(server.server_port, 0)
