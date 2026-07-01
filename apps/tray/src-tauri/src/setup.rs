use std::sync::{atomic::AtomicBool, Mutex};
use url::Url;
use tauri::menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;
use tauri_plugin_autostart::ManagerExt;

use super::{AuthState, AutostartItem, SignAuthItem};

pub fn run(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let icon = tauri::image::Image::new_owned(crate::tray::build_tray_image(), 32, 32);
    let is_autostart = app.autolaunch().is_enabled().unwrap_or(false);

    let autostart_item = CheckMenuItemBuilder::new("Launch on startup")
        .id("autostart").checked(is_autostart).build(app)?;
    let sign_auth_item = MenuItemBuilder::new("Sign Out").id("sign-auth").build(app)?;
    let menu = MenuBuilder::new(app)
        .item(&MenuItemBuilder::new("Show / Hide").id("toggle").build(app)?)
        .separator()
        .item(&autostart_item)
        .item(&sign_auth_item)
        .separator()
        .item(&MenuItemBuilder::new("Quit").id("quit").build(app)?)
        .build()?;

    app.manage(AutostartItem(Mutex::new(autostart_item)));
    app.manage(SignAuthItem(Mutex::new(sign_auth_item)));
    app.manage(AuthState(AtomicBool::new(true)));

    // Enable autostart on first launch; user controls it via tray menu after that.
    if let Ok(dir) = app.path().app_config_dir() {
        let marker = dir.join(".autostart_initialized");
        if !marker.exists() {
            let _ = std::fs::create_dir_all(&dir);
            let _ = std::fs::write(&marker, "");
            let _ = app.autolaunch().enable();
            if let Some(s) = app.try_state::<AutostartItem>() {
                if let Ok(i) = s.0.lock() { let _ = i.set_checked(true); }
            }
        }
    }

    TrayIconBuilder::new()
        .icon(icon).menu(&menu).tooltip("CadenceTray")
        .on_menu_event(crate::menu::handle)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event {
                crate::tray::toggle_overlay(tray.app_handle());
            }
        })
        .build(app)?;

    // navigate() forces WebView2 to the correct URL on every startup.
    // Without it, WebView2 persists the last-visited URL between restarts.
    if let Some(w) = app.get_webview_window("overlay") {
        crate::tray::position_overlay(&w);
        #[cfg(debug_assertions)]
        let url = Url::parse("http://localhost:5174/").unwrap();
        #[cfg(not(debug_assertions))]
        let url = Url::parse("tauri://localhost/").unwrap();
        let _ = w.navigate(url);
        let _ = w.show();
    }
    Ok(())
}
