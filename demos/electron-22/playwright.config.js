import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 配置
 * 参考: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  // 测试超时时间（集成测试可能需要更长时间，特别是使用真实接口）
  timeout: 60000,
  expect: {
    // 断言超时时间
    timeout: 10000,
  },
  // 并行运行测试的工作进程数
  workers: 1, // Electron 测试建议串行运行
  // 测试报告
  reporter: [['html'], ['list']],
  // 共享测试配置
  use: {
    // 截图设置
    screenshot: 'only-on-failure',
    // 视频录制
    video: 'retain-on-failure',
  },
  // 项目配置（Electron 测试）
  projects: [
    {
      name: 'electron',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
