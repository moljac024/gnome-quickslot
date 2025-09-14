import Gio from "gi://Gio";
import Shell from "gi://Shell";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

const BUS_NAME = "com.github.moljac024.quickslot";
const OBJ_PATH = "/com/github/moljac024/quickslot";

const IFACE_XML = `
<node>
  <interface name="com.github.moljac024.quickslot">
    <method name="RunOrRaiseById">
      <arg type="s" name="desktop_id" direction="in"/>
      <arg type="b" name="ok" direction="out"/>
    </method>
    <method name="RunOrRaiseBySlot">
      <arg type="i" name="slot" direction="in"/>
      <arg type="b" name="ok" direction="out"/>
    </method>
    <method name="ListFavorites">
      <arg type="as" name="ids" direction="out"/>
    </method>
  </interface>
</node>`;

export default class QuickSlotExtension extends Extension {
  enable() {
    this._appSystem = Shell.AppSystem.get_default();
    this._settings = new Gio.Settings({ schema_id: "org.gnome.shell" });

    this._nodeInfo = Gio.DBusNodeInfo.new_for_xml(IFACE_XML);
    this._ifaceInfo = this._nodeInfo.interfaces[0];

    // We export the object when the session bus is acquired.
    this._exported = null;

    this._ownerId = Gio.DBus.own_name(
      Gio.BusType.SESSION,
      BUS_NAME,
      Gio.BusNameOwnerFlags.NONE,
      // on_bus_acquired(connection, name)
      (connection, _name) => {
        this._exported = Gio.DBusExportedObject.wrapJSObject(this._ifaceInfo, {
          RunOrRaiseById: (desktop_id) => {
            const app = this._appSystem.lookup_app(desktop_id);
            if (!app) return false;
            app.activate(global.get_current_time(), null);
            return true;
          },
          RunOrRaiseBySlot: (slot) => {
            const favs = this._settings.get_strv("favorite-apps");
            const idx = slot - 1;
            if (idx < 0 || idx >= favs.length) return false;
            const app = this._appSystem.lookup_app(favs[idx]);
            if (!app) return false;
            app.activate(global.get_current_time(), null);
            return true;
          },
          ListFavorites: () => this._settings.get_strv("favorite-apps"),
        });
        this._exported.export(connection, OBJ_PATH);
      },
      // on_name_acquired(name)
      null,
      // on_name_lost(name)
      (_name) => {
        // If we lose the name, ensure we unexport (defensive)
        if (this._exported) {
          this._exported.unexport();
          this._exported = null;
        }
      }
    );
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
    this._nodeInfo = null;
    this._ifaceInfo = null;
    this._appSystem = null;
    this._settings = null;
  }
}
