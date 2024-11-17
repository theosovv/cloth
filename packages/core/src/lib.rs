mod renderer;
pub use renderer::Renderer;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main_js() {
    println!("Cloth");
}