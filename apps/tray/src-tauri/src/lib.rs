use std::sync::{atomic::AtomicBool, Mutex};
use tauri::Manager;

mod commands;
mod menu;
mod setup;
mod tray;

struct AutostartItem(Mutex<tauri::menu::CheckMenuItem<tauri::Wry>>);
struct SignAuthItem(Mutex<tauri::menu::MenuItem<tauri::Wry>>);
struct AuthState(AtomicBool);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(w) = app.get_webview_window("overlay") {
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(setup::run)
        .invoke_handler(tauri::generate_handler![
            commands::start_oauth_callback,
            commands::set_signed_in,
        ])
        .run(tauri::generate_context!())
        .expect("error while running CadenceTray");
}
