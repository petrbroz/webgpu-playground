#version 450 core

layout(location = 0) in vec4 inPos;
layout(location = 1) in vec4 inColor;
layout(set = 0, binding = 0) uniform ViewParams {
    mat4 uMatrix;
};

layout(location = 0) out vec4 outColor;

void main(void) {
    outColor = inColor;
    gl_Position = uMatrix * inPos;
}
