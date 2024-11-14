use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Renderer {
    context: web_sys::WebGl2RenderingContext,
}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: web_sys::HtmlCanvasElement) -> Result<Renderer, JsValue> {
        let context = canvas
            .get_context("webgl2")?
            .unwrap()
            .dyn_into::<web_sys::WebGl2RenderingContext>()?;

        Ok(Renderer { context })
    }

    pub fn clear(&self) {
        self.context.clear_color(0.0, 0.0, 0.0, 1.0);
        self.context.clear(web_sys::WebGl2RenderingContext::COLOR_BUFFER_BIT);
    }
}