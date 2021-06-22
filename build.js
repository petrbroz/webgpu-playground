#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function compileShader(glslPath, outputPath, variableName, shaderStage) {
    const buff = execSync(`glslc -mfmt=num -fshader-stage=${shaderStage} -o - ${glslPath}`);
    fs.writeFileSync(outputPath, `export const ${variableName} = new Uint32Array([\n${buff.toString()}]);`);
}

compileShader(path.join(__dirname, 'shaders', 'basic-vert.glsl'), path.join(__dirname, 'basic-vert.js'), 'BASIC_VERT', 'vert');
compileShader(path.join(__dirname, 'shaders', 'basic-frag.glsl'), path.join(__dirname, 'basic-frag.js'), 'BASIC_FRAG', 'frag');
