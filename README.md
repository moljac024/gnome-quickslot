# gn-runorraise

Wayland-safe **run-or-raise** for GNOME Shell that uses the _same internal logic_ as the dock:

- **By Desktop ID** (e.g. `org.gnome.Nautilus.desktop`)
- **By dock slot** (`--slot N`) → activates the N-th favorite (Super+N semantics, but without the 9-slot limit)

No X11 hacks; we call `org.gnome.Shell.Eval` and use `Shell.AppSystem.lookup_app(...).activate(...)`.

## Install

```bash
git clone https://github.com/<your-gh-username>/gn-runorraise
cd gn-runorraise
just install
```
