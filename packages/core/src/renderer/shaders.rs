use wasm_bindgen::JsValue;
use web_sys::{ WebGl2RenderingContext, WebGlProgram, WebGlShader};

pub const VERTEX_SHADER_SOURCE: &str = include_str!("shaders/vertex.glsl");
pub const FRAGMENT_SHADER_SOURCE: &str = include_str!("shaders/fragment.glsl");

pub fn compile_shader(
    context: &WebGl2RenderingContext,
    shader_type: u32,
    shader_source: &str,
) -> Result<WebGlShader, JsValue> {
  let shader = context
    .create_shader(shader_type)
    .ok_or("Unable to create shader object")?;

  context.shader_source(&shader, shader_source);
  context.compile_shader(&shader);

  if context
    .get_shader_parameter(&shader, WebGl2RenderingContext::COMPILE_STATUS)
    .as_bool()
    .unwrap_or(false)
  {
    Ok(shader)
  } else {
    Err(JsValue::from_str(
      &context
        .get_shader_info_log(&shader)
        .unwrap_or("Unknown error creating shader".into()),
    ))
  }
}

pub fn link_program(
  context: &WebGl2RenderingContext,
  vertex_shader: &WebGlShader,
  fragment_shader: &WebGlShader,
) -> Result<WebGlProgram, JsValue> {
  let program = context
    .create_program()
    .ok_or("Unable to create shader program")?;

  context.attach_shader(&program, vertex_shader);
  context.attach_shader(&program, fragment_shader);
  context.link_program(&program);

  if context
    .get_program_parameter(&program, WebGl2RenderingContext::LINK_STATUS)
    .as_bool()
    .unwrap_or(false)
  {
    Ok(program)
  } else {
    Err(JsValue::from_str(
      &context
        .get_program_info_log(&program)
        .unwrap_or("Unknown error creating program object".into()),
    ))
  }
}