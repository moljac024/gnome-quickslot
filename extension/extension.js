import Gio from "gi://Gio";
import Shell from "gi://Shell";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { createHandlers } from "./handlers.js";

const BUS_NAME = "com.github.moljac024.quickslot";
const OBJ_PATH = "/com/github/moljac024/quickslot";

const IFACE_XML = `
<node>
  <interface name="com.github.moljac024.quickslot">
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
</node>`;

export default class QuickSlotExtension extends Extension {
  enable() {
    // Bind deps once
    const appSystem = Shell.AppSystem.get_default();
    const settings = new Gio.Settings({ schema_id: "org.gnome.shell" });
    const tracker = Shell.WindowTracker.get_default();

    // Build handlers with deps closed over
    const handlers = createHandlers({ appSystem, settings, tracker });

    const nodeInfo = Gio.DBusNodeInfo.new_for_xml(IFACE_XML);
    const ifaceInfo = nodeInfo.interfaces[0];

    // Own name; export object when bus is acquired
    this._ownerId = Gio.DBus.own_name(
      Gio.BusType.SESSION,
      BUS_NAME,
      Gio.BusNameOwnerFlags.NONE,
      (connection) => {
        this._exported = Gio.DBusExportedObject.wrapJSObject(ifaceInfo, {
          RunOrRaiseById: handlers.runOrRaiseById,
          RunOrRaiseBySlot: handlers.runOrRaiseBySlot,
          ListFavorites: handlers.listFavorites,
        });
        this._exported.export(connection, OBJ_PATH);
      },
      null,
      () => {
        if (this._exported) {
          this._exported.unexport();
          this._exported = null;
        }
      },
    );

    // Keep references for disable()
    this._settings = settings;
    this._appSystem = appSystem;
    this._tracker = tracker;
  }

  disable() {
    if (this._ownerId) {
      Gio.DBus.unown_name(this._ownerId);
      this._ownerId = null;
    }
    if (this._exported) {
      this._exported.unexport();
      this._exported = null;
    }
    this._settings = this._appSystem = this._tracker = null;
  }
}
