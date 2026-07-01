use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::atomic::Ordering;
use tauri::{Emitter, Manager};

use super::{AuthState, SignAuthItem};

#[tauri::command]
pub fn start_oauth_callback(app: tauri::AppHandle) -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| format!("bind failed: {e}"))?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();

    std::thread::spawn(move || {
        if let Ok((mut stream, _)) = listener.accept() {
            let mut buf = vec![0u8; 8192];
            let n = stream.read(&mut buf).unwrap_or(0);
            let request = String::from_utf8_lossy(&buf[..n]);
            let path = request
                .lines()
                .next()
                .and_then(|l| l.split_whitespace().nth(1))
                .unwrap_or("/")
                .to_string();

            // Only forward real OAuth callbacks; bare "/" means browser closed mid-flow.
            if path.starts_with("/sso-callback") {
                let _ = app.emit("oauth-callback", path);
            }

            let html = r#"<!doctype html><html><head><title>Cadence</title>
<style>body{font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#0d1117;color:#e8edf5}</style>
</head><body><div style="text-align:center">
<p style="font-size:18px;font-weight:600">Signed in successfully</p>
<p style="opacity:.6;font-size:14px">You can close this tab and return to Cadence.</p>
<script>setTimeout(()=>window.close(),1000)</script>
</div></body></html>"#;
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                html.len(), html
            );
            let _ = stream.write_all(response.as_bytes());
        }
    });

    Ok(port)
}

#[tauri::command]
pub fn set_signed_in(app: tauri::AppHandle, signed_in: bool) {
    app.state::<AuthState>().0.store(signed_in, Ordering::Relaxed);
    if let Some(state) = app.try_state::<SignAuthItem>() {
        if let Ok(item) = state.0.lock() {
            let _ = item.set_text(if signed_in { "Sign Out" } else { "Sign In" });
        }
    }
}
