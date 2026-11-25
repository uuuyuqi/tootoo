"""Shared quota revision signals and on-disk settings root."""
import os
import secrets
import threading
import time

_CONDITION = threading.Condition()
_generation = secrets.randbits(40)  # not the same cursor after backend restart


def data_root():
    return os.path.expanduser(os.environ.get("TOOTOO_HOME") or
                              os.environ.get("TOOTOO_DATA_DIR") or "~/.tootoo")


def generation():
    with _CONDITION:
        return _generation


def publish():
    global _generation
    with _CONDITION:
        _generation += 1
        _CONDITION.notify_all()


def wait(previous, timeout=20, stopped=None):
    deadline = time.monotonic() + timeout
    with _CONDITION:
        while _generation == previous:
            if stopped and stopped():
                break
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                break
            _CONDITION.wait(min(.5, remaining) if stopped else remaining)
        return _generation
