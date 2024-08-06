// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom};
use tauri::command;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[command]
fn test() {
//     let mut file = File::open("example.txt")?;
//
//     // Move the cursor to the 1024th byte
//     file.seek(SeekFrom::Start(1024))?;
//
//     // Buffer to hold the data
//     let mut buffer = [0; 1024];
//
//     // Read the next 1024 bytes into the buffer
//     let bytes_read = file.read(&mut buffer)?;
//
//     // Print the number of bytes read and the data as a string
//     println!("Read {} bytes.", bytes_read);
//     println!("Data: {}", String::from_utf8_lossy(&buffer[..bytes_read]));
    println!("Read bytes.");
//     Ok()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
