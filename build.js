#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function compile(glslPath, outputPath, variableName, shaderStage) {
    const buff = execSync(`glslc -mfmt=num -fshader-stage=${shaderStage} -o - ${glslPath}`);
    fs.writeFileSync(outputPath, `export const ${variableName} = new Uint32Array([\n${buff.toString()}]);`);
}

const shaderFolder = path.join(__dirname, 'shaders');
compile(path.join(shaderFolder, 'basic-vert.glsl'), path.join(shaderFolder, 'basic-vert.js'), 'BASIC_VERT', 'vert');
compile(path.join(shaderFolder, 'basic-frag.glsl'), path.join(shaderFolder, 'basic-frag.js'), 'BASIC_FRAG', 'frag');
