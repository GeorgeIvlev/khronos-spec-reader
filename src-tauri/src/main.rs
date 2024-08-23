// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::get;

// use tokio::io::{AsyncReadExt, AsyncWriteExt};
use quick_xml::de::{from_reader, from_str, DeError};
use quick_xml::Reader as AsyncReader;

use serde::{Deserialize, Serialize};
use std::fmt;

use std::error::Error;

use tokio::fs::File;
use tokio::io::{AsyncBufReadExt, BufReader};

use tauri::command;

// https://raw.githubusercontent.com/KhronosGroup/OpenGL-Registry/main/xml/gl.xml
// https://raw.githubusercontent.com/KhronosGroup/Vulkan-Docs/main/xml/vk.xml
const VULKAN_URL: &str = "https://raw.githubusercontent.com/KhronosGroup/Vulkan-Docs/main/xml/vk.xml";
const OPENGL_URL: &str = "https://raw.githubusercontent.com/KhronosGroup/OpenGL-Registry/main/xml/gl.xml";
// ---------------------------------------------------
#[derive(Debug, Deserialize, Serialize)]
struct Command {
    proto: String,
    name: String,
    params: Vec<Param>,
}

#[derive(Debug, Deserialize, Serialize)]
struct Param {
    ptype: String,
    name: String,
    #[serde(default)]
    group: Option<String>,
    #[serde(default)]
    kind: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct Commands {
    namespace: String,
    commands: Vec<Command>,
}
// ---------------------------------------------------
// fn find_command(xml_content: &str, keyword: &str) -> Result<Option<Command>, Box<dyn Error>> {
//     let registry: Registry = from_str(xml_content)?;
//
//     for command in registry.commands.commands {
//         if command.proto.content.contains(keyword) {
//             return Ok(Some(command));
//         }
//     }
//
//     Ok(None)
// }
>>>>>>> 2a822d6 (Improved saving gl and vulkan docs. Added basic layout to app. Added test logic to parse xml docs and return data from rust backend.)


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// #[command]
// async fn invokeMyAss() {
//     // Retrieve opengl xml data and save it to local cache file
//     let bytes = reqwest::get(OPENGL_URL)
//         .await
//         .unwrap()
//         .text()
//         .await;
//
//     let mut file = File::create("../.app-cache/cache_docs_gl.xml").await;
//     file.expect("REASON").write_all(bytes.unwrap().as_bytes()).await;
//
//     // Retrieve vulkan xml data and save it to local cache file
//     let bytes = reqwest::get(VULKAN_URL)
//         .await
//         .unwrap()
//         .text()
//         .await;
//
//     let mut file = File::create("../.app-cache/cache_docs_vulkan.xml").await;
//     file.expect("REASON").write_all(bytes.unwrap().as_bytes()).await;
// }

// async fn read_xml_file(file_path: &str) -> Result<String, Box<dyn Error>> {
//     let mut file = File::open(file_path).await?;
//     let mut contents = String::new();
//     file.read_to_string(&mut contents).await?;
//     Ok(contents)
// }
//
// #[command]
// async fn search_keyword(keyword: &str) -> Result<(), ()> {
//     let cache = read_xml_file("../.app-cache/cache_docs_gl.xml")
//         .await
//         .unwrap();
//
//     // println!("FILE CONTENT: {:?}", cache);
//     if let command = find_command(&cache, keyword) {
//         println!("Found command: {:?}", command);
//     } else {
//         println!("Command not found.");
//     }
//
//     Ok(())
// }

#[derive(Debug, Serialize)]
enum MyError {
    IoError(String),
    XmlError(String),
    Other(String),
}

impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MyError::IoError(err) => write!(f, "IO error: {}", err),
            MyError::XmlError(err) => write!(f, "XML error: {}", err),
            MyError::Other(err) => write!(f, "Other error: {}", err),
        }
    }
}

impl Error for MyError {}

impl From<std::io::Error> for MyError {
    fn from(error: std::io::Error) -> Self {
        MyError::IoError(error.to_string())
    }
}

impl From<quick_xml::DeError> for MyError {
    fn from(error: quick_xml::DeError) -> Self {
        MyError::XmlError(error.to_string())
    }
}

impl From<Box<dyn Error>> for MyError {
    fn from(error: Box<dyn Error>) -> Self {
        MyError::Other(error.to_string())
    }
}

#[command]
async fn get_all_commands() -> Result<Vec<Command>, MyError> {
    // Open the XML file asynchronously
    let file = File::open("../.app-cache/cache_docs_gl.xml").await.map_err(MyError::from)?;
    let reader = BufReader::new(file);

    // Parse the XML file into the Commands struct
    let commands: Commands = from_reader(reader).map_err(MyError::from)?;

    // Return the list of commands
    Ok(commands.commands)

//     let commands = vec![
//         Command {
//             proto: "void".to_string(),
//             name: "glAccum".to_string(),
//             params: vec![
//                 Param {
//                     ptype: "GLenum".to_string(),
//                     name: "op".to_string(),
//                     group: None,
//                     kind: None,
//                 },
//                 Param {
//                     ptype: "GLfloat".to_string(),
//                     name: "value".to_string(),
//                     group: None,
//                     kind: None,
//                 },
//             ],
//         },
//         Command {
//             proto: "void".to_string(),
//             name: "glActiveProgramEXT".to_string(),
//             params: vec![],
//         },
//     ];
//
//     Ok(commands)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, get_all_commands])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
