#!/bin/bash

# Enable the CRB (CodeReady Builder) repository for additional development tools
sudo dnf config-manager --set-enabled crb
sudo dnf update -y

# Install development tools and necessary libraries
sudo dnf groupinstall -y "Development Tools"

# Install Python 3 development tools and pip
sudo dnf install -y python3-pip python3-devel

# Install Node.js and npm from NodeSource
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Install additional packages for building RPM and DEB packages
sudo dnf install -y \
    git \
    rpm-build \
    dpkg \
    cairo-devel \
    gobject-introspection-devel \
    pango \
    systemd-devel

# Install required Python tools without attempting to uninstall system packages
python3 -m pip install --upgrade pip
python3 -m pip install --ignore-installed pyinstaller sphinx pytest

# Add /usr/local/bin to PATH for this session
export PATH=$PATH:/usr/local/bin

# To make this change persistent, add it to ~/.bashrc
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc

# Confirm installed versions
echo "Python version: $(python3 --version)"
echo "Pip version: $(python3 -m pip --version)"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "RPM version: $(rpm --version)"
echo "dpkg version: $(dpkg --version | head -n 1)"
echo "Development tools installed"

# Clone or navigate to your DATAGerry repository
# Uncomment the following line if you need to clone the repository
# git clone https://your-repo-url.git

# Install Node.js packages (if needed for building the web interface)
# cd /path/to/your/datagerry/app
# npm install
