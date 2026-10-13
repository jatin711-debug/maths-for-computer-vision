"""Print the local lab environment without downloading data or models."""
import importlib
import sys


def main():
    print("Python", sys.version.split()[0])
    missing = []
    for name in ("numpy", "PIL", "torch", "torchvision", "cv2"):
        try:
            module = importlib.import_module(name)
            print(name, getattr(module, "__version__", "available"))
        except (ImportError, RuntimeError, OSError) as error:
            missing.append(name)
            print(name, "UNAVAILABLE:", str(error))
    if missing:
        raise SystemExit("Install course/practical/requirements.txt in your activated environment; install torch and torchvision together.")
    import torch
    print("CUDA available:", torch.cuda.is_available())
    print("Ready. CPU is the default. First dataset/model downloads require internet.")


if __name__ == "__main__":
    main()
