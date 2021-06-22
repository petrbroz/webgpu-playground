import { BASIC_VERT } from './basic-vert.js';
import { BASIC_FRAG } from './basic-frag.js';

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

    // Setup rendering pipeline
    const layout = device.createPipelineLayout({ bindGroupLayouts: [] });
    const renderPipeline = device.createRenderPipeline({
        layout: layout,
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

    function render() {
        const renderPassDesc = {
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
        const commandEncoder = device.createCommandEncoder();
        const renderPassEncoder = commandEncoder.beginRenderPass(renderPassDesc);
        renderPassEncoder.setPipeline(renderPipeline);
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
