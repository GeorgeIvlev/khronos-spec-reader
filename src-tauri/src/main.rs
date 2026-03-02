#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::Path;
use std::fs;
use std::fs::File;
use std::io::Read;
use tauri::{ ipc::Channel, AppHandle, Manager, Window, State, Emitter, Runtime };
use serde::{ Deserialize, Serialize };
// use tokio::process::Command;

use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::thread;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
enum CommandEvent {
    Stdout(String),
    Stderr(String),
    Error(String),
    Finished(i32),
}

// #[tauri::command]
// fn stream_data(channel: IpcChannel<String>) {
//     std::thread::spawn(move || {
//         for i in 0..1000 {
//             channel.send(format!("Message {}", i)).unwrap();
//             std::thread::sleep(std::time::Duration::from_millis(10));
//         }
//     });
// }

#[derive(serde::Serialize, Clone)]
struct DirEntry {
    name: String,
    path: String,
    isFile: bool,
}

#[tauri::command]
async fn list_directory_contents(path: String) -> Result<Vec<DirEntry>, String> {
    let path = Path::new(&path);

    if !path.is_absolute() || path.components().any(|c| c.as_os_str() == "..") {
        return Err("Invalid path".to_string());
    }

    // Attempt to read the directory
    let entries = fs::read_dir(path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut result = Vec::new();

    for entry in entries.flatten() {
        let entry_path = entry.path();
        let name = entry_path
            .file_name()
            .unwrap_or_default() // Handle potential errors for file names
            .to_string_lossy() // Convert OsStr to string, handling non-UTF8
            .to_string();

        result.push(DirEntry {
            name,
            path: entry_path.to_string_lossy().to_string(),
            isFile: entry_path.is_file(),
        });
    }

    Ok(result)
}

// ----------------------------------------------------
// Streaming file logic
// ----------------------------------------------------
const STREAM_START_EVENT_NAME: &str = "file-stream-start";
const STREAM_DATA_EVENT_NAME: &str = "file-stream-chunk";
const STREAM_END_EVENT_NAME: &str = "file-stream-end";

// Payload for the start event
#[derive(Serialize, Clone)]
struct StreamStart {
    file_size: u64, // The total size of the file being streamed
    // Other metadata if needed (e.g., file name, checksum)
}

// Payload for the chunk event
#[derive(Serialize, Clone)]
struct StreamChunk {
    data: Vec<u8>, // The chunk of bytes
    offset: u64,   // The byte offset in the original file where this chunk starts
}

// Payload for the end event
#[derive(Serialize, Clone)]
struct StreamEnd {
    success: bool,
    error: Option<String>,
}

#[tauri::command]
async fn stream_file_content(window: Window, path: String) -> Result<(), String> {
    let path = Path::new(&path);

    if !path.is_absolute() || path.components().any(|c| c.as_os_str() == "..") {
        return Err("Invalid path".to_string());
    }

    // Open the file
    let mut file = File::open(path)
        .map_err(|e| format!("Failed to open file: {}", e))?;

    // Get the total file size
    let file_size = file
        .metadata()
        .map_err(|e| format!("Failed to get file metadata: {}", e))?
        .len();

    println!("Streaming file: {}, size: {} bytes", path.display(), file_size);

    // Emit the start event with the file size
    let start_payload = StreamStart { file_size };
    if let Err(e) = window.emit(STREAM_START_EVENT_NAME, start_payload) {
        eprintln!("Error emitting stream start event: {}", e);
        return Err(format!("Error emitting start event: {}", e));
    }
    // 8192 - 8KB
    // 4096 - 4KB
    // 1024 - 1KB
    let mut buffer = [0; 4096]; // Read in 4KB chunks (adjust size as needed)
    let mut total_bytes_sent = 0u64;

    loop {
        match file.read(&mut buffer) {
            Ok(0) => {
                println!("Stream completed for file: {}", path.display());
                let end_payload = StreamEnd {
                    success: true,
                    error: None,
                };
                if let Err(e) = window.emit(STREAM_END_EVENT_NAME, end_payload) {
                    eprintln!("Error emitting stream end event: {}", e);
                    break;
                }
                break;
            }
            Ok(bytes_read) => {
                let chunk_data = buffer[..bytes_read].to_vec();
                let chunk_offset = total_bytes_sent;
                let chunk_payload = StreamChunk {
                    data: chunk_data,
                    offset: chunk_offset,
                };

                // Emit the data chunk event
                if let Err(e) = window.emit(STREAM_DATA_EVENT_NAME, chunk_payload) {
                    eprintln!("Error emitting stream data event: {}", e);
                    let end_payload = StreamEnd {
                        success: false,
                        error: Some(e.to_string()),
                    };
                    let _ = window.emit(STREAM_END_EVENT_NAME, end_payload);
                    break;
                }
                total_bytes_sent += bytes_read as u64;
                println!("Emitted chunk of {} bytes, total: {}", bytes_read, total_bytes_sent);
            }
            Err(e) => {
                eprintln!("Error reading file: {}", e);
                let end_payload = StreamEnd {
                    success: false,
                    error: Some(e.to_string()),
                };
                // Emit the end event with an error
                if let Err(emit_err) = window.emit(STREAM_END_EVENT_NAME, end_payload) {
                    eprintln!("Error emitting stream end event after read error: {}", emit_err);
                }
                return Err(format!("Error reading file: {}", e));
            }
        }
    }

    Ok(())
}
// ----------------------------------------------------

// #[tauri::command]
// async fn exec(command: &str) -> Result<String, String> {
//     let output = Command::new("cmd")
//         .args(&["/C", command])
//         .output()
//         .await
//         .map_err(|e| e.to_string())?;
//
//     println!("stdout: {}", String::from_utf8_lossy(&output.stdout));
//     println!("stderr: {}", String::from_utf8_lossy(&output.stderr));
//
//     Ok(format!("Hello, {}! You've been exec from Rust!", command))
// }
#[tauri::command]
async fn exec_command(command: String, channel: Channel<CommandEvent>) -> Result<(), String> {
    // Spawn command with piped stdout/stderr
    let mut child = Command::new("cmd")
        .args(&["/C", &command])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;

    let channel_stdout = channel.clone();
    let channel_stderr = channel.clone();
    let channel_finish = channel.clone();

    // Spawn thread for stdout
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = channel_stdout.send(CommandEvent::Stdout(line));
            }
        }
    });

    // Spawn thread for stderr
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = channel_stderr.send(CommandEvent::Stderr(line));
            }
        }
    });

    // Wait for completion in async context
    tokio::task::spawn_blocking(move || {
        let status = child.wait().expect("Failed to wait on child");
        let exit_code = status.code().unwrap_or(-1);
        let _ = channel_finish.send(CommandEvent::Finished(exit_code));
    });

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            exec_command,
            list_directory_contents,
            stream_file_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
