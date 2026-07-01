use std::sync::atomic::Ordering;
use tauri::{Emitter, Manager};
use tauri_plugin_autostart::ManagerExt;

use super::{AuthState, AutostartItem};

pub fn handle(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "quit" => app.exit(0),
        "toggle" => crate::tray::toggle_overlay(app),
        "sign-auth" => {
            let signed_in = app.state::<AuthState>().0.load(Ordering::Relaxed);
            if signed_in {
                let _ = app.emit("sign-out", ());
            } else if let Some(w) = app.get_webview_window("overlay") {
                let _ = w.show();
                let _ = w.set_focus();
            }
        }
        "autostart" => {
            let al = app.autolaunch();
            let on = if al.is_enabled().unwrap_or(false) {
                let _ = al.disable();
                false
            } else {
                let _ = al.enable();
                true
            };
            if let Some(s) = app.try_state::<AutostartItem>() {
                if let Ok(i) = s.0.lock() {
                    let _ = i.set_checked(on);
                }
            }
        }
        _ => {}
    }
}
