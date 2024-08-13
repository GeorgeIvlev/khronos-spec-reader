// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::get;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use std::error::Error;

use tauri::command;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// https://raw.githubusercontent.com/KhronosGroup/OpenGL-Registry/main/xml/gl.xml
// https://raw.githubusercontent.com/KhronosGroup/Vulkan-Docs/main/xml/vk.xml

#[command]
async fn invokeMyAss() {
//     let file2 = File::create("foo.txt");
//     file2.expect("REASON").write_all(b"Hello, world!");
//     let file = File::open("example.txt");

    let url = "https://raw.githubusercontent.com/KhronosGroup/OpenGL-Registry/main/xml/gl.xml";

    // Make the GET request and await the response
    let response = reqwest::get(url).await;
    let status = response.clone().unwrap().status().as_u16();

    // Get the response body as a string and await it
    let body = response.unwrap().text().await;

    // Save the response body to a file
    let mut file = File::create("gl.xml").await;
    file.expect("REASON").write_all(body.expect("REASON").as_bytes()).await;
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, invokeMyAss])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
