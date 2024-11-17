mod shaders;
use wasm_bindgen::prelude::*;
use web_sys::{WebGl2RenderingContext, WebGlProgram, WebGlShader, WebGlBuffer, HtmlCanvasElement};

#[wasm_bindgen]
pub struct Renderer {
    context: WebGl2RenderingContext,
    program: WebGlProgram,
    buffer: WebGlBuffer,
}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: HtmlCanvasElement) -> Result<Renderer, JsValue> {
        let context = canvas
            .get_context("webgl2")?
            .unwrap()
            .dyn_into::<WebGl2RenderingContext>()?;

        let vertex_shader = shaders::compile_shader(
          &context,
          WebGl2RenderingContext::VERTEX_SHADER,
          shaders::VERTEX_SHADER_SOURCE,
        )?;

        let fragment_shader = shaders::compile_shader(
          &context,
          WebGl2RenderingContext::FRAGMENT_SHADER,
          shaders::FRAGMENT_SHADER_SOURCE,
        )?;

        let program = shaders::link_program(
          &context,
          &vertex_shader,
          &fragment_shader,
        )?;

        let buffer = context.create_buffer().ok_or("Unable to create buffer")?;

        Ok(Renderer { context, program, buffer })
    }

    pub fn resize(&self, width: u32, height: u32) {
        self.context.viewport(0, 0, width as i32, height as i32);
    }

    pub fn clear(&self) {
        self.context.clear_color(0.0, 0.0, 0.0, 1.0);
        self.context.clear(WebGl2RenderingContext::COLOR_BUFFER_BIT);
    }

    pub fn set_vertices(&self, vertices: &[f32]) -> Result<(), JsValue>  {
        self.context.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&self.buffer));
        unsafe {
          let vertex_array = js_sys::Float32Array::view(vertices);
          self.context.buffer_data_with_array_buffer_view(
              WebGl2RenderingContext::ARRAY_BUFFER,
              &vertex_array,
              WebGl2RenderingContext::STATIC_DRAW,
          );
      }

      Ok(())
    }

    pub fn render(&self, vertex_count: i32) {
      self.context.clear_color(0.0, 0.0, 0.0, 1.0);
      self.context.clear(WebGl2RenderingContext::COLOR_BUFFER_BIT);

      self.context.use_program(Some(&self.program));

      self.context.enable_vertex_attrib_array(0);

      self.context.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&self.buffer));

      self.context.vertex_attrib_pointer_with_i32(
          0,
          3,
          WebGl2RenderingContext::FLOAT,
          false,
          0,
          0,
      );

      self.context.draw_arrays(WebGl2RenderingContext::TRIANGLES, 0, vertex_count);
    }
}