import argparse
import os
import signal
import socket
import sys
from pathlib import Path


def _pick_port(preferred: int | None) -> int:
    if preferred and preferred > 0:
        return preferred
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def _prepend_path(directory: Path) -> None:
    if directory.exists():
        os.environ["PATH"] = f"{directory}{os.pathsep}" + os.environ.get("PATH", "")


def _configure_runtime_env(resource_dir: Path | None) -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "src.config.settings")
    os.environ.setdefault("DJANGO_DEBUG", "true")

    if not resource_dir:
        return

    ffmpeg_dir = resource_dir / "ffmpeg"
    _prepend_path(ffmpeg_dir)

    models_dir = resource_dir / "models"
    if models_dir.exists():
        os.environ.setdefault("HF_HOME", str(models_dir))
        os.environ.setdefault("TRANSFORMERS_CACHE", str(models_dir))
        os.environ.setdefault("TORCH_HOME", str(models_dir / "torch"))


def _start_waitress(port: int) -> None:
    from django.core.wsgi import get_wsgi_application
    from waitress import serve

    application = get_wsgi_application()
    serve(application, host="127.0.0.1", port=port, threads=8)


def main() -> int:
    parser = argparse.ArgumentParser(description="Melodii backend sidecar")
    parser.add_argument("--port", type=int, default=0)
    parser.add_argument("--resource-dir", type=str, default=None)
    args = parser.parse_args()

    resource_dir = Path(args.resource_dir) if args.resource_dir else None
    _configure_runtime_env(resource_dir)

    port = _pick_port(args.port)
    print(f"MELODII_PORT={port}", flush=True)

    def _handle_exit(_signum, _frame):
        sys.exit(0)

    signal.signal(signal.SIGTERM, _handle_exit)
    signal.signal(signal.SIGINT, _handle_exit)

    _start_waitress(port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
