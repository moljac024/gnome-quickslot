# Use bash with strict flags
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

home     := env_var('HOME')
src  := 'src'
build_dir := "dist"
ext_uuid := 'quickslot@moljac024.github'
ext_dest := home + '/.local/share/gnome-shell/extensions/' + ext_uuid

build:
    @echo "Building the extension…"
    rm -rf "{{build_dir}}"
    npx tsc
    cp "{{src}}/metadata.json" "{{build_dir}}/"
    @echo "Build complete."

# Copy/Install the extension into local extensions dir
install:
    @echo "Installing GNOME Shell extension to {{ext_dest}}"
    rm -rf "{{ext_dest}}"
    mkdir -p "{{ext_dest}}"
    cp -r "{{src}}/"* "{{ext_dest}}/"

# Enable the extension
enable: install
    @echo "Enabling extension {{ext_uuid}}…"
    gnome-extensions enable {{ext_uuid}}
    @echo "If on Wayland, you may need to log out/in the first time."

# Disable the extension
disable:
    @echo "Disabling extension {{ext_uuid}}…"
    gnome-extensions disable {{ext_uuid}}

# Remove the extension files
uninstall: disable
    @echo "Removing extension at {{ext_dest}}"
    rm -rf "{{ext_dest}}"

# Quick status check
status:
    gnome-extensions info {{ext_uuid}}
    gdbus introspect --session --dest com.github.moljac024.quickslot --object-path /com/github/moljac024/quickslot

# Reinstall extension files and toggle it
reload:
    @echo "Reloading QuickSlot extension (reinstall + toggle)…"
    just ext-install
    gnome-extensions disable {{ext_uuid}} || true
    gnome-extensions enable {{ext_uuid}}
    @echo "Reloaded {{ext_uuid}}."

# Follow GNOME Shell logs; useful after `just reload`
logs:
    @echo "Tailing GNOME Shell logs (Ctrl-C to stop)…"
    journalctl --user -f | grep -Ei 'gnome-shell|quickslot'
