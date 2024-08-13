// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::get;
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use quick_xml::de::from_str;
use serde::Deserialize;

use std::error::Error;

use tauri::command;

// ---------------------------------------------------
#[derive(Debug, Deserialize)]
struct Registry {
    commands: Commands,
}

#[derive(Debug, Deserialize)]
struct Commands {
    #[serde(rename = "command")]
    commands: Vec<Command>,
}

#[derive(Debug, Deserialize)]
struct Command {
    proto: Proto,
}

#[derive(Debug, Deserialize)]
struct Proto {
    #[serde(rename = "name")]
    content: String,
}
// ---------------------------------------------------
fn find_command(xml_content: &str, keyword: &str) -> Result<Option<Command>, Box<dyn Error>> {
    let registry: Registry = from_str(xml_content)?;

    for command in registry.commands.commands {
        if command.proto.content.contains(keyword) {
            return Ok(Some(command));
        }
    }

    Ok(None)
}


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
    let bytes = reqwest::get(url)
        .await
        .unwrap()
        .text()
        .await;
    // println!("{:?}", result)

    // Get the response body as a string and await it
    // Save the response body to a file
    let mut file = File::create("../.app-cache/cache_docs_gl.xml").await;
    file.expect("REASON").write_all(bytes.unwrap().as_bytes()).await;
}

async fn read_xml_file(file_path: &str) -> Result<String, Box<dyn Error>> {
    let mut file = File::open(file_path).await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    Ok(contents)
}
#[command]
async fn search_keyword(keyword: &str) -> Result<(), ()> {
    let cache = read_xml_file("../.app-cache/cache_docs_gl.xml")
        .await
        .unwrap();

    // println!("FILE CONTENT: {:?}", cache);
    if let command = find_command(&cache, keyword) {
        println!("Found command: {:?}", command);
    } else {
        println!("Command not found.");
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, invokeMyAss, search_keyword])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
