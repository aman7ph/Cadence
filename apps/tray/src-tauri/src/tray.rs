use tauri::{Emitter, Manager, PhysicalPosition};

pub fn build_tray_image() -> Vec<u8> {
    const SIZE: u32 = 32;
    let mut px = vec![0u8; (SIZE * SIZE * 4) as usize];
    let circles: [(f32, f32, f32, [u8; 3]); 2] = [
        (12.0, 12.0, 9.5, [74, 158, 255]),
        (20.0, 20.0, 9.5, [61, 214, 140]),
    ];
    for y in 0..SIZE {
        for x in 0..SIZE {
            let idx = ((y * SIZE + x) * 4) as usize;
            let fx = x as f32 + 0.5;
            let fy = y as f32 + 0.5;
            for (cx, cy, r, rgb) in circles.iter().rev() {
                if ((fx - cx).powi(2) + (fy - cy).powi(2)).sqrt() <= *r {
                    px[idx] = rgb[0];
                    px[idx + 1] = rgb[1];
                    px[idx + 2] = rgb[2];
                    px[idx + 3] = 255;
                    break;
                }
            }
        }
    }
    px
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
