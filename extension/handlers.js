import Shell from "gi://Shell";
import Meta from "gi://Meta";

/**
 * Factory: bind GNOME deps once, return focused handlers.
 *
 * @param {{appSystem: Shell.AppSystem, settings: import('gi://Gio').Settings, tracker: Shell.WindowTracker}} deps
 */
export function createHandlers({ appSystem, settings, tracker }) {
  function nowTs() {
    return global.display.get_current_time_roundtrip
      ? global.display.get_current_time_roundtrip()
      : global.get_current_time();
  }

  function activateApp(app) {
    // Prefer activate_full(ts, workspace) to properly raise/focus
    const ts = nowTs();
    const wm = global.workspace_manager;
    const ws = wm ? wm.get_active_workspace() : null;
    if (app.activate_full) {
      // GNOME 45+ has activate_full(ts, workspace)
      try {
        app.activate_full(ts, ws);
        return true;
      } catch {
        /* fall through */
      }
    }
    // Fallbacks
    try {
      app.activate();
      return true;
    } catch {
      return false;
    }
  }

  function runOrRaiseWithCycle(app) {
    try {
      const ts = nowTs();
      const wins = app.get_windows() || [];

      if (wins.length === 0) {
        // No windows yet → launch/raise app onto current workspace
        return activateApp(app);
      }

      // If already focused and multiple windows → cycle to next
      const focusWin = global.display.get_focus_window();
      const focusedApp = focusWin ? tracker.get_window_app(focusWin) : null;

      if (
        focusedApp &&
        focusedApp.get_id &&
        focusedApp.get_id() === app.get_id() &&
        wins.length > 1
      ) {
        let idx = -1;
        for (let i = 0; i < wins.length; i++) {
          if (wins[i] === focusWin) {
            idx = i;
            break;
          }
        }
        const next = idx === -1 ? 0 : (idx + 1) % wins.length;
        wins[next].activate(ts);
        return true;
      }

      // Otherwise let Shell pick the MRU window and raise it
      return activateApp(app);
    } catch (e) {
      global.logError(new Error(`QuickSlot logic error: ${e}`));
      try {
        return activateApp(app);
      } catch {
        return false;
      }
    }
  }

  function runOrRaiseById(desktopId) {
    try {
      const app = appSystem.lookup_app(desktopId);
      if (!app) return false;
      return runOrRaiseWithCycle(app);
    } catch (e) {
      global.logError(new Error(`QuickSlot RunOrRaiseById error: ${e}`));
      return false;
    }
  }

  function runOrRaiseBySlot(slot) {
    try {
      const favs = settings.get_strv("favorite-apps");
      const idx = Number(slot) - 1;
      if (!(Array.isArray(favs) && idx >= 0 && idx < favs.length)) return false;
      const app = appSystem.lookup_app(favs[idx]);
      if (!app) return false;
      return runOrRaiseWithCycle(app);
    } catch (e) {
      global.logError(new Error(`QuickSlot RunOrRaiseBySlot error: ${e}`));
      return false;
    }
  }

  function listFavorites() {
    try {
      const favs = settings.get_strv("favorite-apps");
      return Array.isArray(favs) ? favs : [];
    } catch (e) {
      global.logError(new Error(`QuickSlot ListFavorites error: ${e}`));
      return [];
    }
  }

  return {
    runOrRaiseWithCycle,
    runOrRaiseById,
    runOrRaiseBySlot,
    listFavorites,
  };
}
