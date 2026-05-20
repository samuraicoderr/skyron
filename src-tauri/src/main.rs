use std::sync::{mpsc, Mutex};
use std::time::Duration;

use tauri::{Manager, State};
use tauri_plugin_shell::{process::CommandEvent, ShellExt};

#[derive(Default)]
struct BackendState {
    child: Mutex<Option<tauri_plugin_shell::process::CommandChild>>,
    port: Mutex<Option<u16>>,
}

fn parse_port_line(line: &str) -> Option<u16> {
    let trimmed = line.trim();
    if let Some(value) = trimmed.strip_prefix("MELODII_PORT=") {
        return value.trim().parse::<u16>().ok();
    }
    None
}

fn start_backend_inner(app: &tauri::AppHandle, state: &BackendState) -> Result<u16, String> {
    if let Some(port) = *state.port.lock().map_err(|_| "State lock poisoned")? {
        return Ok(port);
    }

    let mut child_guard = state.child.lock().map_err(|_| "State lock poisoned")?;
    if child_guard.is_some() {
        return Err("Backend process is already starting".into());
    }

    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|_| "Failed to resolve resource dir")?;

    let mut command = app
        .shell()
        .sidecar("melodii-backend")
        .map_err(|e| format!("Failed to start sidecar: {e}"))?;

    command = command
        .arg("--port")
        .arg("0")
        .arg("--resource-dir")
        .arg(resource_dir.to_string_lossy().to_string());

    let (mut rx, child) = command
        .spawn()
        .map_err(|e| format!("Failed to spawn backend: {e}"))?;

    *child_guard = Some(child);
    drop(child_guard);

    let (port_tx, port_rx) = mpsc::channel::<u16>();
    std::thread::spawn(move || {
        while let Ok(event) = rx.recv() {
            if let CommandEvent::Stdout(line) = event {
                if let Some(port) = parse_port_line(&line) {
                    let _ = port_tx.send(port);
                    break;
                }
            }
        }
    });

    let port = port_rx
        .recv_timeout(Duration::from_secs(15))
        .map_err(|_| "Backend did not report a port")?;

    *state.port.lock().map_err(|_| "State lock poisoned")? = Some(port);
    Ok(port)
}

fn stop_backend_inner(state: &BackendState) -> Result<(), String> {
    if let Ok(mut child_guard) = state.child.lock() {
        if let Some(mut child) = child_guard.take() {
            let _ = child.kill();
        }
    }
    if let Ok(mut port_guard) = state.port.lock() {
        *port_guard = None;
    }
    Ok(())
}

#[tauri::command]
fn start_backend(app: tauri::AppHandle, state: State<'_, BackendState>) -> Result<u16, String> {
    start_backend_inner(&app, &state)
}

#[tauri::command]
fn get_backend_url(app: tauri::AppHandle, state: State<'_, BackendState>) -> Result<String, String> {
    let port = start_backend_inner(&app, &state)?;
    Ok(format!("http://127.0.0.1:{port}/api/v1"))
}

#[tauri::command]
fn stop_backend(state: State<'_, BackendState>) -> Result<(), String> {
    stop_backend_inner(&state)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BackendState::default())
        .setup(|app| {
            let app_handle = app.handle();
            let state = app.state::<BackendState>();
            std::thread::spawn(move || {
                let _ = start_backend_inner(&app_handle, &state);
            });
            Ok(())
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                let state = event.window().app_handle().state::<BackendState>();
                let _ = stop_backend_inner(&state);
                api.prevent_close();
                event.window().app_handle().exit(0);
            }
        })
        .invoke_handler(tauri::generate_handler![
            start_backend,
            get_backend_url,
            stop_backend
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
