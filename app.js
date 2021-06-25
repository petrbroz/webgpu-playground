import { BASIC_VERT } from './shaders/basic-vert.js';
import { BASIC_FRAG } from './shaders/basic-frag.js';

async function initRenderer(canvas) {
    if (!navigator.gpu) {
        throw new Error('WebGPU not supported.');
    }

    // Setup high level API
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const context = canvas.getContext('gpupresent');

    // Setup vertex buffer
    const buffer = device.createBuffer({
        size: 3 * 2 * 4 * 4, // 3 vertices, each one with 2 float4s (one for position and one for color)
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
    });
    new Float32Array(buffer.getMappedRange()).set([
        1, -1, 0, 1,  // position
        1, 0, 0, 1,   // color
        -1, -1, 0, 1, // position
        0, 1, 0, 1,   // color
        0, 1, 0, 1,   // position
        0, 0, 1, 1,   // color
    ]);
    buffer.unmap();

    // Setup uniform buffer
    const uniformBuffer = device.createBuffer({
        size: 16 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });
    new Float32Array(uniformBuffer.getMappedRange()).set([
        1.0, 0.0, 0.0, 0.0,
        0.0, 2.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);
    uniformBuffer.unmap();

    // Setup swap chain
    const swapChainFormat = 'bgra8unorm';
    context.configure({
        device: device,
        format: swapChainFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    const depthFormat = 'depth24plus-stencil8';
    const depthTexture = device.createTexture({
        size: {
            width: canvas.width,
            height: canvas.height,
            depth: 1
        },
        format: depthFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    // Setup vertex pipeline state
    const vertexState = {
        buffers: [
            {
                arrayStride: 2 * 4 * 4,
                attributes: [
                    {
                        format: 'float32x4',
                        offset: 0,
                        shaderLocation: 0
                    },
                    {
                        format: 'float32x4',
                        offset: 4 * 4,
                        shaderLocation: 1
                    }
                ]
            }
        ],
        module: device.createShaderModule({ code: BASIC_VERT }),
        entryPoint: 'main'
    };

    // Setup fragment pipeline state
    const fragmentState = {
        targets: [
            {
                format: swapChainFormat,
                // blend: {
                //     alpha: {
                //         srcFactor: 'src-alpha',
                //         dstFactor: 'one-minus-src-alpha',
                //         operation: 'add'
                //     },
                //     color: {
                //         srcFactor: 'src-alpha',
                //         dstFactor: 'one-minus-src-alpha',
                //         operation: 'add'
                //     }
                // }
            }
        ],
        module: device.createShaderModule({ code: BASIC_FRAG }),
        entryPoint: 'main'
    };

    // Setup uniform bindings
    const uniformBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
                type: 'uniform'
            }
        }]
    });
    const uniformBindGroup = device.createBindGroup({
        layout: uniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer
                }
            }
        ]
    });

    // Setup rendering pipeline
    const renderPipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [uniformBindGroupLayout] }),
        vertex: vertexState,
        fragment: fragmentState,
        primitive: {
            topology: 'triangle-list'
        },
        depthStencil: {
            format: depthFormat,
            depthWriteEnabled: true,
            depthCompare: 'less'
        }
    });

    let matrix = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);
    let renderPassDesc = {
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadValue: [0.3, 0.6, 0.9, 1]
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadValue: 1.0,
            depthStoreOp: 'store',
            stencilLoadValue: 0,
            stencilStoreOp: 'store'
        }
    };
    function render(t) {
        let c = Math.cos(0.001 * t), s = Math.sin(0.001 * t);
        matrix[0] = c; matrix[1] = -s; matrix[4] = s; matrix[5] = c;
        device.queue.writeBuffer(uniformBuffer, 0, matrix);
        renderPassDesc.colorAttachments[0].view = context.getCurrentTexture().createView();
        const commandEncoder = device.createCommandEncoder();
        const renderPassEncoder = commandEncoder.beginRenderPass(renderPassDesc);
        renderPassEncoder.setPipeline(renderPipeline);
        renderPassEncoder.setBindGroup(0, uniformBindGroup);
        renderPassEncoder.setVertexBuffer(0, buffer);
        renderPassEncoder.draw(3, 1, 0, 0);
        renderPassEncoder.endPass();
        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

initRenderer(document.getElementById('viewport'))
    .catch(err => console.error(err));
