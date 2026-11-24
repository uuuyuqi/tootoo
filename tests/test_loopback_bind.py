import unittest
from unittest.mock import patch

from server import TooTooHandler, TooTooServer


class LoopbackBindTests(unittest.TestCase):
    def test_loopback_listens_without_reverse_lookup(self):
        with patch("socket.getfqdn", side_effect=AssertionError("unexpected DNS")), \
                TooTooServer(("127.0.0.1", 0), TooTooHandler) as server:
            self.assertEqual(server.server_name, "127.0.0.1")
            self.assertEqual(server.server_port, server.server_address[1])
            self.assertGreater(server.server_port, 0)
