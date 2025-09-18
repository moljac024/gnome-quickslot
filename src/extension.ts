import Gio from "gi://Gio"
import Shell from "gi://Shell"
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js"
import { createHandlers } from "./handlers.js"

const BUS_NAME = "com.github.moljac024.quickslot"
const OBJ_PATH = "/" + BUS_NAME.replace(/\./g, "/")

const DBUS_INTERFACE = `
<node>
  <interface name="${BUS_NAME}">
    <method name="RunOrRaiseById">
      <arg type="s"  name="desktop_id" direction="in"/>
      <arg type="b"  name="ok"         direction="out"/>
    </method>
    <method name="RunOrRaiseBySlot">
      <arg type="i"  name="slot"       direction="in"/>
      <arg type="b"  name="ok"         direction="out"/>
    </method>
    <method name="ListFavorites">
      <arg type="as" name="ids"        direction="out"/>
    </method>
  </interface>
</node>`

export default class QuickSlotExtension extends Extension {
  settings: Gio.Settings | null = null
  appSystem: Shell.AppSystem | null = null
  tracker: Shell.WindowTracker | null = null

  enable() {
    // Bind deps once
    const appSystem = Shell.AppSystem.get_default()
    const tracker = Shell.WindowTracker.get_default()
    const settings = new Gio.Settings({ schema_id: "org.gnome.shell" })

    // Build handlers with deps closed over
    const handlers = createHandlers({ appSystem, settings, tracker })

    // Keep references for disable()
    this.settings = settings
    this.appSystem = appSystem
    this.tracker = tracker
  }

  disable() {
    this.settings = null
    this.appSystem = null
    this.tracker = null
  }
}
