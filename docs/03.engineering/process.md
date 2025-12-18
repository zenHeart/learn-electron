# process

## gpu

get gpu info

- [app.getGPUFeatureStatus](https://www.electronjs.org/docs/latest/api/app#appgetgpufeaturestatus) to get gpu config like `chrome://gpu`

```json
{
  "2d_canvas": "enabled", // canvas 使用 gpu 加速
  "canvas_oop_rasterization": "disabled_off", // canvas 栅格化独立进程启用
  "direct_rendering_display_compositor": "disabled_off_ok", // 直接渲染显示合成器
  "gpu_compositing": "enabled", // gpu 合成启用
  "multiple_raster_threads": "enabled_on", // 多个栅格线程启用
  "opengl": "enabled_on", // opengl 启用
  "rasterization": "enabled", // 栅格化启用
  "raw_draw": "disabled_off_ok", // 绕过合成器直接绘制到 framebuffer 禁用，可以通过 --enable-features=RawDraw 开启
  "video_decode": "enabled", // 硬件视频解码启用
  "video_encode": "enabled", // 硬件视频编码启用
  "vulkan": "disabled_off", // vulkan api 禁用
  "webgl": "enabled", // webgl 启用
  "webgl2": "enabled", // webgl2 启用
  "webgpu": "enabled" // webgpu 启用
}
```

- [app.getGPUInfo](https://www.electronjs.org/docs/latest/api/app#appgetgpuinfoinfotype) get device gpu info，信息含义详见 chromium 源码 `gpu_info.cc`

```jsonc
{
  "auxAttributes": {
    "amdSwitchable": false, // ✗ 非 AMD PowerXpress（独显切换技术）
    "canSupportThreadedTextureMailbox": false, // ✗ 不支持线程化纹理邮箱 Intel 集显限制
    "dx12FeatureLevel": "D3D 12.1", // Direct3D 12.1 特性级别支持 (12.0=Win10, 12.1=Win10/11 高级功能)
    "glExtensions": "GL_AMD_performance_monitor GL_ANGLE_base_vertex_base_instance GL_ANGLE_base_vertex_base_instance_shader_builtin GL_ANGLE_client_arrays GL_ANGLE_depth_texture GL_ANGLE_framebuffer_blit GL_ANGLE_framebuffer_multisample GL_ANGLE_get_serialized_context_string GL_ANGLE_get_tex_level_parameter GL_ANGLE_instanced_arrays GL_ANGLE_lossy_etc_decode GL_ANGLE_memory_size GL_ANGLE_multi_draw GL_ANGLE_pack_reverse_row_order GL_ANGLE_program_cache_control GL_ANGLE_provoking_vertex GL_ANGLE_request_extension GL_ANGLE_robust_client_memory GL_ANGLE_texture_compression_dxt3 GL_ANGLE_texture_compression_dxt5 GL_ANGLE_texture_usage GL_ANGLE_translated_shader_source GL_CHROMIUM_bind_generates_resource GL_CHROMIUM_bind_uniform_location GL_CHROMIUM_color_buffer_float_rgb GL_CHROMIUM_color_buffer_float_rgba GL_CHROMIUM_copy_compressed_texture GL_CHROMIUM_copy_texture GL_CHROMIUM_lose_context GL_CHROMIUM_sync_query GL_EXT_EGL_image_external_wrap_modes GL_EXT_base_instance GL_EXT_blend_func_extended GL_EXT_blend_minmax GL_EXT_clip_control GL_EXT_color_buffer_half_float GL_EXT_debug_label GL_EXT_debug_marker GL_EXT_discard_framebuffer GL_EXT_disjoint_timer_query GL_EXT_draw_buffers GL_EXT_draw_elements_base_vertex GL_EXT_float_blend GL_EXT_frag_depth GL_EXT_instanced_arrays GL_EXT_map_buffer_range GL_EXT_multi_draw_indirect GL_EXT_multisampled_render_to_texture GL_EXT_occlusion_query_boolean GL_EXT_read_format_bgra GL_EXT_robustness GL_EXT_sRGB GL_EXT_shader_texture_lod GL_EXT_texture_compression_bptc GL_EXT_texture_compression_dxt1 GL_EXT_texture_compression_rgtc GL_EXT_texture_compression_s3tc_srgb GL_EXT_texture_filter_anisotropic GL_EXT_texture_format_BGRA8888 GL_EXT_texture_norm16 GL_EXT_texture_rg GL_EXT_texture_storage GL_EXT_texture_type_2_10_10_10_REV GL_EXT_unpack_subimage GL_KHR_debug GL_KHR_parallel_shader_compile GL_NV_EGL_stream_consumer_external GL_NV_fence GL_NV_framebuffer_blit GL_NV_pack_subimage GL_NV_pixel_buffer_object GL_OES_EGL_image GL_OES_EGL_image_external GL_OES_compressed_EAC_R11_signed_texture GL_OES_compressed_EAC_R11_unsigned_texture GL_OES_compressed_EAC_RG11_signed_texture GL_OES_compressed_EAC_RG11_unsigned_texture GL_OES_compressed_ETC2_RGB8_texture GL_OES_compressed_ETC2_RGBA8_texture GL_OES_compressed_ETC2_punchthroughA_RGBA8_texture GL_OES_compressed_ETC2_punchthroughA_sRGB8_alpha_texture GL_OES_compressed_ETC2_sRGB8_alpha8_texture GL_OES_compressed_ETC2_sRGB8_texture GL_OES_depth24 GL_OES_depth32 GL_OES_draw_elements_base_vertex GL_OES_element_index_uint GL_OES_fbo_render_mipmap GL_OES_get_program_binary GL_OES_mapbuffer GL_OES_packed_depth_stencil GL_OES_rgb8_rgba8 GL_OES_standard_derivatives GL_OES_surfaceless_context GL_OES_texture_border_clamp GL_OES_texture_float GL_OES_texture_float_linear GL_OES_texture_half_float GL_OES_texture_half_float_linear GL_OES_texture_npot GL_OES_texture_stencil8 GL_OES_vertex_array_object GL_WEBGL_video_texture ", // OpenGL 扩展列表（300+ 扩展）
    "glRenderer": "ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11-31.0.101.4502)", // 渲染器标识 (vs_5_0=Vertex Shader 5.0, ps_5_0=Pixel Shader 5.0)
    "glResetNotificationStrategy": 33362, // 0x8252 = GL_LOSE_CONTEXT_ON_RESET GPU 上下文重置时通知策略
    "glVendor": "Google Inc. (Intel)", // GL 厂商（Google 维护 ANGLE，底层 Intel GPU）
    "glVersion": "OpenGL ES 2.0.0 (ANGLE 2.1.19731 git hash: 29ccea193816)", // ANGLE 翻译层版本号 (ANGLE = Almost Native Graphics Layer Engine)
    "glWsExtensions": "EGL_EXT_create_context_robustness EGL_ANGLE_d3d_share_handle_client_buffer EGL_ANGLE_d3d_texture_client_buffer EGL_ANGLE_surface_d3d_texture_2d_share_handle EGL_ANGLE_query_surface_pointer EGL_ANGLE_window_fixed_size EGL_ANGLE_keyed_mutex EGL_ANGLE_surface_orientation EGL_ANGLE_direct_composition EGL_NV_post_sub_buffer EGL_KHR_create_context EGL_KHR_image EGL_KHR_image_base EGL_KHR_gl_texture_2D_image EGL_KHR_gl_texture_cubemap_image EGL_KHR_gl_renderbuffer_image EGL_KHR_get_all_proc_addresses EGL_KHR_stream EGL_KHR_stream_consumer_gltexture EGL_NV_stream_consumer_gltexture_yuv EGL_ANGLE_stream_producer_d3d_texture EGL_ANGLE_create_context_webgl_compatibility EGL_CHROMIUM_create_context_bind_generates_resource EGL_CHROMIUM_sync_control EGL_EXT_pixel_format_float EGL_KHR_surfaceless_context EGL_ANGLE_display_texture_share_group EGL_ANGLE_display_semaphore_share_group EGL_ANGLE_create_context_client_arrays EGL_ANGLE_program_cache_control EGL_ANGLE_robust_resource_initialization EGL_ANGLE_create_context_extensions_enabled EGL_ANDROID_blob_cache EGL_ANDROID_recordable EGL_ANGLE_image_d3d11_texture EGL_ANGLE_create_context_backwards_compatible EGL_KHR_no_config_context EGL_KHR_create_context_no_error EGL_KHR_reusable_sync ", // EGL 扩展列表
    "glWsVendor": "Google Inc. (Intel)", // EGL 厂商
    "glWsVersion": "1.5 (ANGLE 2.1.19731 git hash: 29ccea193816)", // EGL（OpenGL ES 窗口系统）版本号
    "inProcessGpu": false, // ✗ GPU 进程独立 (out-of-process，更安全)
    "initializationTime": 331.187, // GPU 初始化耗时 = 331.187 毫秒
    "isAsan": false, // ✗ 非 AddressSanitizer 模式 (未启用内存检查工具)
    "jpegDecodeAcceleratorSupported": false, // ✗ 不支持硬件 JPEG 解码
    "maxMsaaSamples": "16", // 最大 MSAA(多重采样) = 16x
    "optimus": false, // ✗ 非 NVIDIA Optimus（独显切换技术）
    "overlayInfo": {
      "directComposition": true, // ✓ 支持 DirectComposition（Windows 合成框架）
      "nv12OverlaySupport": "SCALING", // NV12 颜色格式覆盖层支持 (支持缩放 -> 用于 H.264/HEVC 视频解码)
      "supportsOverlays": true, // ✓ GPU 支持硬件覆盖层, 在 108 中这个配置可以通过 --disable-direct-composition-video-overlays 和 --enable-direct-composition-video-overlays 控制
      "yuy2OverlaySupport": "SCALING" // YUY2 颜色格式覆盖层支持等级 (SCALING=支持缩放)
    },
    "passthroughCmdDecoder": true, // ✓ 使用 Passthrough 命令解码器 (GPU 指令直接发送，性能最佳)
    "pixelShaderVersion": "5.0", // 像素着色器版本 = SM 5.0
    "sandboxed": false, // ✗ 不在沙箱中 (通常在调试模式或 Windows 10+ 上为 false)
    "softwareRendering": false, // ✗ 非软件渲染 ✓ 使用硬件加速
    "subpixelFontRendering": true, // ✓ 支持亚像素字体渲染 (ClearType/DirectWrite)
    "supportsD3dSharedImages": true, // ✓ 支持 D3D 共享纹理 用于跨进程 GPU 内存共享
    "supportsDx12": true, // ✓ 支持 Direct3D 12
    "supportsVulkan": true, // ✓ 支持 Vulkan API
    "targetCpuBits": 32, // 目标 CPU 架构 = 32 位 (注意：这可能是错的，应该是 64 位)
    "vertexShaderVersion": "5.0", // 顶点着色器版本 = SM 5.0
    "videoDecodeAcceleratorSupportedProfile": {
      "encrypted_only": false, // ✓ 支持非加密视频解码
      "maxResolutionHeight": 8192, // 最大解码高度 = 8K
      "maxResolutionWidth": 8192, // 最大解码宽度 = 8K (8192×8192)
      "minResolutionHeight": 64, // 最小解码宽度 = 64 像素
      "minResolutionWidth": 64,
      "profile": 29 // H.264 High Profile (Profile ID 29)
    },
    "videoEncodeAcceleratorSupportedProfile": {
      "maxFramerateDenominator": 1, // 最高帧率分母 = 1 → 30 fps
      "maxFramerateNumerator": 30, // 最高帧率分子 = 30 fps
      "maxResolutionHeight": 1088, // 最大编码高度 = 1080p (含黑边)
      "maxResolutionWidth": 1920, // 最大编码宽度 = 1080p
      "minResolutionHeight": 32,
      "minResolutionWidth": 32,
      "profile": 3 // H.264 Main Profile (Profile ID 3)
    },
    "visibilityCallbackCallCount": 0, // GPU 可见性回调调用次数 = 0
    "vulkanVersion": "Vulkan API 1.3.0" // Vulkan 版本 = 1.3.0
  },
  "gpuDevice": [
    {
      "active": true, // ✓ 当前活跃使用（Windows 上由 ANGLE 决定）
      "cudaComputeCapabilityMajor": 0, // NVIDIA CUDA 计算能力（0 = 非 NVIDIA GPU）
      "deviceId": 42920, // PCI 设备 ID = 0xA7A8 = Intel UHD Graphics（仅在 Intel 内唯一）
      "driverVendor": "Intel", // 驱动开发商
      "driverVersion": "31.0.101.4502", // 驱动版本号 (31.x = Intel Arc/UHD 驱动版本)
      "gpuPreference": 0, // GPU 性能偏好 (0=kNone, 1=kHighPerformance, 2=kLowPower)
      "revision": 4, // GPU 硬件版本号 = 0x04（13th Gen Alderlake stepping）
      "subSysId": 1047796197, // 子系统 ID = 0x3E7419E5 (低16位=厂商ID, 高16位=子系统ID)
      "vendorId": 32902 // PCI 厂商 ID = 0x8086 = Intel Corporation
    },
    {
      "active": false, // ✗ 未活跃（备用方案）
      "cudaComputeCapabilityMajor": 0, // 非 NVIDIA
      "deviceId": 140, // Microsoft 软件渲染设备 ID
      "driverVersion": "10.0.26100.7309", // Windows 11 系统版本
      "gpuPreference": 0, // 无偏好
      "revision": 0, // 无实际硬件版本
      "subSysId": 0, // 无子系统 ID
      "vendorId": 5140 // = 0x144C = Microsoft 软件渲染
    }
  ]
}
```
