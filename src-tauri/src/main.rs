#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::Path;
use std::fs;
use std::fs::File;
use std::io::Read;
use tauri::{ ipc::Channel, AppHandle, Window, State, Emitter };
use serde::{ Deserialize, Serialize };
use uuid::{Uuid};
use std::process::{Stdio};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader, BufWriter};
use tokio::sync::{Mutex, Notify};
use std::sync::Arc;
use tokio::process::{Child, ChildStdin, ChildStdout, Command};
use tokio::time::{sleep, Duration, timeout, interval};

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
    id: String,
    name: String,
    path: String,
    isFile: bool,
}

const NAMESPACE_DNS: Uuid = Uuid::from_u128(0x6ba7b810_9dad_11d1_80b4_00c04fd430c8);

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
            id: Uuid::new_v5(&NAMESPACE_DNS, name.as_bytes()).to_string(),
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
                // println!("Stream completed for file: {}", path.display());
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
                // println!("Emitted chunk of {} bytes, total: {}", bytes_read, total_bytes_sent);
            }
            Err(e) => {
                // eprintln!("Error reading file: {}", e);
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
    #[cfg(target_os = "windows")]
    let mut child = Command::new("cmd")
        .args(&["/C", &command])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn: {}", e))?;

    #[cfg(not(target_os = "windows"))]
    let mut child = Command::new("sh")
        .args(&["-c", &command])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn: {}", e))?;

    let stdout = child.stdout.take().ok_or_else(|| "Failed to capture stdout".to_string())?;
    let stderr = child.stderr.take().ok_or_else(|| "Failed to capture stderr".to_string())?;

    let channel_stdout = channel.clone();
    let channel_stderr = channel.clone();
    let channel_finish = channel.clone();

    // Spawn thread for stdout
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        
        while let Ok(Some(line)) = lines.next_line().await {
            if let Err(e) = channel_stdout.send(CommandEvent::Stdout(line)) {
                eprintln!("Failed to send stdout: {}", e);
                break;
            }
        }
    });

    // Spawn thread for stderr
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr);
        let mut lines = reader.lines();
        
        while let Ok(Some(line)) = lines.next_line().await {
            if let Err(e) = channel_stderr.send(CommandEvent::Stderr(line)) {
                eprintln!("Failed to send stderr: {}", e);
                break;
            }
        }
    });

    // Wait for completion in async context
    tokio::spawn(async move {
        match child.wait().await {
            Ok(status) => {
                let exit_code = status.code().unwrap_or(-1);
                let _ = channel_finish.send(CommandEvent::Finished(exit_code));
            }
            Err(e) => {
                let _ = channel_finish.send(CommandEvent::Error(format!("Failed to wait: {}", e)));
            }
        }
    });

    Ok(())
}

// ------------------------------------------------------------------------
// Search files by pattern ( using system "fd" command )
// ------------------------------------------------------------------------
#[derive(Clone, Serialize)]
struct SearchHandle {
    pub id: String,
}

#[derive(Clone, Serialize)]
pub struct ContentMatch {
    pub path: String,
    pub line: u32,
    pub text: String,
}

#[tauri::command]
async fn search_files(
    window: Window,
    pattern: String,
    path: String,
) -> Result<SearchHandle, String> {
    let id = Uuid::new_v4().to_string();
    let id_clone = id.clone();
    let window_clone = window.clone();

    // Spawn fd process for this search only
    let mut child = tokio::process::Command::new("fd")
        .args([
            &pattern,
            &path,
            "--type=f",
            "--threads=1",
            "--max-results=1000000",
            "--color=never",
            "--absolute-path",
            "--print0"
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn fd: {}", e))?;

    let stdout = child.stdout.take().ok_or("No stdout")?;
    let reader = BufReader::new(stdout);
    let mut lines = reader.split(b'\0');

    // Stream results in background
    tokio::spawn(async move {
        let mut batch: Vec<String> = Vec::with_capacity(100);
        let mut interval = interval(Duration::from_millis(16));

        loop {
            tokio::select! {
                result = lines.next_segment() => {
                    match result {
                        Ok(Some(chunk)) if !chunk.is_empty() => {
                            let line = String::from_utf8_lossy(&chunk).to_string();
                            batch.push(line);
                            
                            if batch.len() >= 100 {
                                let _ = window_clone.emit(&format!("search:{}", id_clone), &batch);
                                batch.clear();
                            }
                        }
                        Ok(None) => break, // EOF
                        Ok(_) => continue,
                        Err(_) => break,
                    }
                }
                _ = interval.tick() => {
                    if !batch.is_empty() {
                        let _ = window_clone.emit(&format!("search:{}", id_clone), &batch);
                        batch.clear();
                    }
                }
            }
        }

        // Final flush
        if !batch.is_empty() {
            let _ = window_clone.emit(&format!("search:{}", id_clone), &batch);
        }

        // Wait for process to finish and emit done
        let _ = child.wait().await;
        let _ = window_clone.emit(&format!("search:{}:done", id_clone), ());
    });

    Ok(SearchHandle { id })
}

#[tauri::command]
async fn search_content(
    window: Window,
    pattern: String,
    path: String,
) -> Result<SearchHandle, String> {
    let id = Uuid::new_v4().to_string();
    let id_clone = id.clone();
    let window_clone = window.clone();

    // Spawn rg process
    let mut child = tokio::process::Command::new("rg")
        .args([
            "--trim",
            "-0",
            "-l",
            &pattern,
            &path,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn rg: {}", e))?;

    let stdout = child.stdout.take().ok_or("No stdout")?;
    let reader = BufReader::new(stdout);
    let mut lines = reader.split(b'\0');

    // Stream results in background
    tokio::spawn(async move {
        let mut batch: Vec<String> = Vec::with_capacity(50);
        let mut interval = interval(Duration::from_millis(16));

        loop {
            tokio::select! {
                result = lines.next_segment() => {
                    match result {
                        Ok(Some(chunk)) if !chunk.is_empty() => {
                            let result_path = String::from_utf8_lossy(&chunk).to_string();
                            batch.push(result_path);
                                
                            if batch.len() >= 50 {
                                let _ = window_clone.emit(&format!("search:{}", id_clone), &batch);
                                batch.clear();
                            }
                        }
                        Ok(None) => break,
                        Ok(_) => continue,
                        Err(_) => break,
                    }
                }
                _ = interval.tick() => {
                    if !batch.is_empty() {
                        let _ = window_clone.emit(&format!("search:{}", id_clone), &batch);
                        batch.clear();
                    }
                }
            }
        }

        // Final flush
        if !batch.is_empty() {
            let _ = window_clone.emit(&format!("search:{}", id_clone), &batch);
        }

        let _ = child.wait().await;
        let _ = window_clone.emit(&format!("search:{}:done", id_clone), ());
    });

    Ok(SearchHandle { id })
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    let file = tokio::fs::File::create(&path)
        .await
        .map_err(|e| format!("Create failed: {}", e))?;

    let mut writer = BufWriter::with_capacity(64 * 1024, file);

    writer.write_all(content.as_bytes())
        .await
        .map_err(|e| format!("Write failed: {}", e))?;

    writer.flush()
        .await
        .map_err(|e| format!("Flush failed: {}", e))?;

    Ok(())

}

// -----------------------------------------------------
// LSP Server implementation
// -----------------------------------------------------
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum ClangdMessage {
    Initialize { root_uri: String },
    Initialized,
    DidOpen { uri: String, language_id: String, text: String },
    DidChange { uri: String, changes: Vec<TextDocumentContentChangeEvent> },
    Completion { uri: String, line: u32, character: u32 },
    Definition { uri: String, line: u32, character: u32 },
    Hover { uri: String, line: u32, character: u32 },
    Shutdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextDocumentContentChangeEvent {
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClangdResponse {
    pub jsonrpc: String,
    pub id: Option<i64>,
    pub method: Option<String>,
    pub result: Option<serde_json::Value>,
    pub error: Option<serde_json::Value>,
    pub params: Option<serde_json::Value>,
}

pub struct ClangdManager {
    process: std::sync::Arc<tokio::sync::Mutex<Option<ClangdProcess>>>,
    initialized: Arc<Notify>,
}

struct ClangdProcess {
    stdin: Arc<Mutex<BufWriter<ChildStdin>>>,
    _child: Child, // CRITICAL: Keep child alive
    request_id: Arc<Mutex<i64>>,
}

impl ClangdManager {
    pub fn new() -> Self {
        Self {
            process: Arc::new(Mutex::new(None)),
            initialized: Arc::new(Notify::new()),
        }
    }

    pub async fn start(
        &self,
        _app: AppHandle,
        on_event: Channel<ClangdResponse>,
    ) -> Result<(), String> {
        let mut guard = self.process.lock().await;

        if guard.is_some() {
            return Err("clangd already running".to_string());
        }

        println!("Starting clangd process...");

        let mut child = Command::new("clangd")
            .current_dir("C:/Users/georg/CLionProjects/test_webview")
            .args([
                "--compile-commands-dir=C:/Users/georg/CLionProjects/test_webview/cmake-build-debug",
                "--background-index=false",  // Disable for faster startup
                "--clang-tidy=false",
                "--log=verbose",
            ])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn clangd: {}", e))?;

        let stdin = child.stdin.take().ok_or("No stdin")?;
        let stdout = child.stdout.take().ok_or("No stdout")?;
        let stderr = child.stderr.take().ok_or("No stderr")?;

        // Wrap stdin in BufWriter for async writing
        let stdin = Arc::new(Mutex::new(BufWriter::new(stdin)));
        let request_id = Arc::new(Mutex::new(0i64));

        // Keep child in struct so it doesn't get dropped
        let process = ClangdProcess {
            stdin: stdin.clone(),
            _child: child, // CRITICAL
            request_id: request_id.clone(),
        };

        *guard = Some(process);

        // Spawn stdout reader (async)
        let stdout_reader = BufReader::new(stdout);
        tokio::spawn(async move {
            read_stdout(stdout_reader, on_event).await;
        });

        // Spawn stderr reader (async)
        let stderr_reader = BufReader::new(stderr);
        tokio::spawn(async move {
            let mut lines = stderr_reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                eprintln!("[clangd stderr] {}", line);
            }
        });

        println!("clangd started successfully");
        Ok(())
    }

    pub async fn stop(&self) -> Result<(), String> {
        let mut guard = self.process.lock().await;
        *guard = None;
        Ok(())
    }

    pub async fn send_message(&self, msg: ClangdMessage) -> Result<(), String> {
        // // Wait for initialization before sending other messages
        // if !matches!(msg, ClangdMessage::Initialize { .. }) {
        //     println!("Waiting for initialization...");
        //     match tokio::time::timeout(
        //         tokio::time::Duration::from_secs(15),
        //         self.initialized.notified()
        //     ).await {
        //         Ok(_) => println!("Initialization confirmed"),
        //         Err(_) => return Err("Timeout waiting for clangd initialization".to_string()),
        //     }
        // }

        let guard = self.process.lock().await;
        let process = guard.as_ref().ok_or("clangd not started")?;

        let (json, _is_notification) = match msg {
            ClangdMessage::Initialize { root_uri } => {
                let id = Self::next_id(&process.request_id).await;
                println!("Sending initialize id={} root={}", id, root_uri);
                (serde_json::json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "method": "initialize",
                    "params": {
                        "processId": std::process::id(),
                        "rootUri": root_uri,
                        "capabilities": {
                            "textDocumentSync": {
                                "dynamicRegistration": false,
                                "openClose": true,
                                "change": 2,
                                "willSave": false,
                                "willSaveWaitUntil": false,
                                "save": false
                            },
                            "completionProvider": {
                                "dynamicRegistration": false,
                                "resolveProvider": false,
                                "triggerCharacters": [".", ":", ">"]
                            },
                            "hoverProvider": { "dynamicRegistration": false },
                            "definitionProvider": { "dynamicRegistration": false },
                            "documentHighlightProvider": { "dynamicRegistration": false },
                            "documentSymbolProvider": { "dynamicRegistration": false }
                        },
                        "workspaceFolders": null,
                        "clientInfo": {
                            "name": "tauri-editor",
                            "version": "0.1.0"
                        }
                    }
                }), false)
            }
            ClangdMessage::Initialized => {
                println!("Sending initialized notification");
                (serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "initialized",
                    "params": {}
                }), true)
            }
            ClangdMessage::DidOpen { uri, language_id, text } => {
                println!("Sending didOpen: {}", uri);
                (serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "textDocument/didOpen",
                    "params": {
                        "textDocument": {
                            "uri": uri,
                            "languageId": language_id,
                            "version": 1,
                            "text": text
                        }
                    }
                }), true)
            }
            ClangdMessage::DidChange { uri, changes } => {
                let content_changes: Vec<serde_json::Value> = changes.into_iter().map(|c| {
                    serde_json::json!({
                        "range": null,
                        "rangeLength": null,
                        "text": c.text
                    })
                }).collect();

                (serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "textDocument/didChange",
                    "params": {
                        "textDocument": {
                            "uri": uri,
                            "version": 2
                        },
                        "contentChanges": content_changes
                    }
                }), true)
            }
            ClangdMessage::Completion { uri, line, character } => {
                let id = Self::next_id(&process.request_id).await;
                (serde_json::json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "method": "textDocument/completion",
                    "params": {
                        "textDocument": { "uri": uri },
                        "position": { "line": line, "character": character },
                        "context": {
                            "triggerKind": 1,
                            "triggerCharacter": "."
                        }
                    }
                }), false)
            }
            ClangdMessage::Definition { uri, line, character } => {
                let id = Self::next_id(&process.request_id).await;
                (serde_json::json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "method": "textDocument/definition",
                    "params": {
                        "textDocument": { "uri": uri },
                        "position": { "line": line, "character": character }
                    }
                }), false)
            }
            ClangdMessage::Hover { uri, line, character } => {
                let id = Self::next_id(&process.request_id).await;
                (serde_json::json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "method": "textDocument/hover",
                    "params": {
                        "textDocument": { "uri": uri },
                        "position": { "line": line, "character": character }
                    }
                }), false)
            }
            ClangdMessage::Shutdown => {
                let id = Self::next_id(&process.request_id).await;
                (serde_json::json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "method": "shutdown"
                }), false)
            }
        };

        let content = json.to_string();
        let header = format!("Content-Length: {}\r\n\r\n", content.len());
        let full = format!("{}{}", header, content);

        println!("[-> clangd] {}", &full[..full.len().min(300)]);

        let mut stdin = process.stdin.lock().await;
        stdin.write_all(full.as_bytes()).await
            .map_err(|e| format!("Write failed: {}", e))?;
        stdin.flush().await
            .map_err(|e| format!("Flush failed: {}", e))?;

        Ok(())
    }

    async fn next_id(request_id: &Arc<Mutex<i64>>) -> i64 {
        let mut guard = request_id.lock().await;
        *guard += 1;
        *guard
    }
}

async fn read_stdout(
    mut reader: BufReader<ChildStdout>,
    channel: Channel<ClangdResponse>,
) {
    let mut buffer = String::new();

    loop {
        buffer.clear();

        // Read Content-Length header (async)
        match reader.read_line(&mut buffer).await {
            Ok(0) => {
                println!("clangd stdout closed (EOF)");
                break;
            }
            Ok(_) => {
                let header = buffer.trim();
                if !header.starts_with("Content-Length: ") {
                    continue;
                }

                let content_length = header[16..].parse::<usize>().unwrap_or(0);
                if content_length == 0 {
                    continue;
                }

                // Read empty line
                let mut empty = String::new();
                if reader.read_line(&mut empty).await.is_err() {
                    break;
                }

                // Read content (async)
                let mut content = vec![0u8; content_length];
                if let Err(e) = reader.read_exact(&mut content).await {
                    eprintln!("Read error: {}", e);
                    break;
                }

                let json_str = String::from_utf8_lossy(&content);
                println!("[clangd <-] {}", json_str);

                // Parse and send to frontend
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(&json_str) {
                    let response = ClangdResponse {
                        jsonrpc: value.get("jsonrpc").and_then(|v| v.as_str()).unwrap_or("2.0").to_string(),
                        id: value.get("id").and_then(|v| v.as_i64()),
                        method: value.get("method").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        result: value.get("result").cloned(),
                        error: value.get("error").cloned(),
                        params: value.get("params").cloned(),
                    };

                    if let Err(e) = channel.send(response) {
                        eprintln!("Channel error: {}", e);
                        break;
                    }
                }
            }
            Err(e) => {
                eprintln!("Read error: {}", e);
                break;
            }
        }
    }

    println!("stdout reader ended");
}

#[tauri::command]
async fn clangd_start(
    app: tauri::AppHandle,
    state: State<'_, ClangdManager>,
    on_event: Channel<ClangdResponse>,
) -> Result<(), String> {
    println!("clangd_start");
    state.start(app, on_event).await
}

#[tauri::command]
async fn clangd_send(
    state: State<'_, ClangdManager>,
    message: ClangdMessage,
) -> Result<(), String> {
    state.send_message(message).await
}

#[tauri::command]
async fn clangd_stop(state: State<'_, ClangdManager>) -> Result<(), String> {
    state.stop().await
}
// -----------------------------------------------------


fn main() {
    #[cfg(target_os = "linux")]
    unsafe {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    }

    tauri::Builder::default()
        .manage(ClangdManager::new())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            search_files,
            search_content,
            write_file,
            clangd_start,
            clangd_send,
            clangd_stop,
            exec_command,
            list_directory_contents,
            stream_file_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
