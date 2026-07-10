use std::sync::Mutex;

use tauri::{Emitter, Manager};

#[derive(Default)]
struct PendingOpenFiles(Mutex<Vec<String>>);

fn is_markdown_path(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    lower.ends_with(".md") || lower.ends_with(".markdown")
}

fn extract_markdown_paths(args: &[String]) -> Vec<String> {
    args.iter()
        .skip(1)
        .filter(|arg| is_markdown_path(arg))
        .cloned()
        .collect()
}

/// Drain paths cached at cold start (file association / CLI args).
#[tauri::command]
fn take_pending_files(state: tauri::State<'_, PendingOpenFiles>) -> Vec<String> {
    let mut pending = state.0.lock().unwrap();
    std::mem::take(&mut *pending)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(PendingOpenFiles::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let file_paths = extract_markdown_paths(&args);
                if !file_paths.is_empty() {
                    if window.emit("open-file", file_paths.clone()).is_err() {
                        let state = app.state::<PendingOpenFiles>();
                        state.0.lock().unwrap().extend(file_paths);
                    }
                }
            }
        }))
        .invoke_handler(tauri::generate_handler![take_pending_files])
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            let startup_files = extract_markdown_paths(&args);
            if !startup_files.is_empty() {
                let state = app.state::<PendingOpenFiles>();
                state.0.lock().unwrap().extend(startup_files);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running EasyMD desktop application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_all_markdown_args() {
        let args = vec![
            "easymd.exe".to_string(),
            r"C:\notes\one.md".to_string(),
            r"C:\notes\two.markdown".to_string(),
            r"C:\notes\ignore.txt".to_string(),
            r"C:\notes\three.MD".to_string(),
        ];

        assert_eq!(
            extract_markdown_paths(&args),
            vec![
                r"C:\notes\one.md".to_string(),
                r"C:\notes\two.markdown".to_string(),
                r"C:\notes\three.MD".to_string(),
            ],
        );
    }
}
