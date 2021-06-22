# webgpu-playground

Experimental [WebGPU](https://www.w3.org/TR/webgpu/#intro) renderer.

## Prerequisites

- WebGPU-enabled browser, for example, Google Chrome Canary
- `glslc` command-line tool (provided by [Vulkan SDK](https://www.lunarg.com/vulkan-sdk/))

## Development

After modifying any of the GLSL files, run `node build.js` from the command-line
to update their corresponding SPIR-V binaries (in _basic-frag.js_ or _basic-vert.js_).
