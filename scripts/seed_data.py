import os
import torchvision
import torchvision.transforms as transforms

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def download_mnist():
    print("Downloading MNIST...")
    transform = transforms.Compose([
        transforms.Resize((32, 32)),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
    ])
    torchvision.datasets.MNIST(DATA_DIR, train=True, download=True, transform=transform)
    torchvision.datasets.MNIST(DATA_DIR, train=False, download=True, transform=transform)
    print("MNIST downloaded.")


def download_cifar10():
    print("Downloading CIFAR-10...")
    transform = transforms.ToTensor()
    torchvision.datasets.CIFAR10(DATA_DIR, train=True, download=True, transform=transform)
    torchvision.datasets.CIFAR10(DATA_DIR, train=False, download=True, transform=transform)
    print("CIFAR-10 downloaded.")


if __name__ == "__main__":
    os.makedirs(DATA_DIR, exist_ok=True)
    download_mnist()
    download_cifar10()
    print("All datasets ready.")
