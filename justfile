# Use bash with strict flags
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

bin_name := 'gnome-quickslot'
bin_dir  := 'bin'
bin_path := bin_dir + '/' + bin_name

ext_uuid := 'quickslot@moljac024.github'
home     := env_var('HOME')
ext_src  := 'extension'
ext_dest := home + '/.local/share/gnome-shell/extensions/' + ext_uuid

# Default target
default: build

# Build static Go binary (create bin/ first; show resolved paths)
build:
    @echo "Building to: {{bin_path}}"
    mkdir -p "{{bin_dir}}"
    CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o "{{bin_path}}" ./cmd

# Install binary to /usr/local/bin
install: build
    @echo "Installing {{bin_name}} to /usr/local/bin (sudo)…"
    sudo install -Dm755 "{{bin_path}}" /usr/local/bin/{{bin_name}}

# Copy/Install the extension into local extensions dir
ext-install:
    @echo "Installing GNOME Shell extension to {{ext_dest}}"
    install -d "{{ext_dest}}"
    install -m 0644 "{{ext_src}}/metadata.json" "{{ext_dest}}/metadata.json"
    install -m 0644 "{{ext_src}}/extension.js" "{{ext_dest}}/extension.js"

# Enable the extension
ext-enable: ext-install
    @echo "Enabling extension {{ext_uuid}}…"
    gnome-extensions enable {{ext_uuid}} || true
    @echo "If on Wayland, you may need to log out/in the first time."

# Disable the extension
ext-disable:
    @echo "Disabling extension {{ext_uuid}}…"
    gnome-extensions disable {{ext_uuid}} || true

# Remove the extension files
ext-uninstall: ext-disable
    @echo "Removing extension at {{ext_dest}}"
    rm -rf "{{ext_dest}}"

# Quick status check
ext-status:
    gnome-extensions info {{ext_uuid}} || true
    gdbus introspect --session --dest com.github.moljac024.quickslot --object-path /com/github/moljac024/quickslot || true

# Run examples
run ID='org.gnome.Terminal.desktop':
    ./{{bin_path}} --id {{ID}}

slot N='1':
    ./{{bin_path}} --slot {{N}}

favs:
    ./{{bin_path}} --list-favorites

# Clean build artifacts
clean:
    rm -rf "{{bin_dir}}"
