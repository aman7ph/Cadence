use tauri::{Emitter, Manager, PhysicalPosition};

/// The system-tray icon: the gyroscope mark, gold on transparent.
///
/// This used to rasterise two solid circles by hand in a nested pixel loop —
/// the pre-redesign mark, in colours (`#4a9eff`, `#3dd68c`) that no longer
/// exist in the palette. A loop like that can only draw shapes simple enough to
/// express as an inequality, which is why it was circles rather than the mark.
///
/// The PNG is generated from the web's own styles/mark.css by
/// .agent/design/harness/icon.mjs, so the tray cannot drift from the app.
/// Regenerate it there rather than replacing this file.
pub fn tray_icon() -> tauri::image::Image<'static> {
    tauri::image::Image::from_bytes(include_bytes!("../icons/tray-32.png"))
        .expect("tray-32.png is embedded at compile time and must decode")
}

pub fn toggle_overlay(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("overlay") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
            let _ = app.emit("overlay-shown", ());
        }
    }
}

pub fn position_overlay(window: &tauri::WebviewWindow) {
    if let Some(monitor) = window.primary_monitor().ok().flatten() {
        let scale = monitor.scale_factor();
        let sw = monitor.size().width as i32;
        let w = (280.0 * scale) as i32;
        let margin = (24.0 * scale) as i32;
        let y = (60.0 * scale) as i32;
        let _ = window.set_position(PhysicalPosition::new(sw - w - margin, y));
    }
}
