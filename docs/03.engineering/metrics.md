# 指标建设

## 原则

- **以业务目标为核心**
  - 什么标志着业务的成功？比如客服域
    - 成交量
    - 终端用户满意度
  - 如果没有业务目标，则通过质量/效率评估
    - NPS
    - 解决率
- **保证系统可观测性** 有完善的体系观察系统的运行状况及时发现系统问题
  - 性能指标
    - 启动时长
    - 响应时长
    - 卡顿率
  - 稳定性指标
    - Crash 率
    - 错误率
  - 资源消耗指标
    - CPU 使用率
    - 内存使用率
    - 电池消耗

## 指标示例

假设以客服域商家工作台为例

1. **业务指标** 效率/质量
   1. 用户视角
      1. 客户满意度（CSAT）质量
   2. 客服视角
      1. 净推荐值（NPS） 质量
      2. 首次解决率 First Contact Resolution (FCR) 质量
      3. 首次响应时间（First Response Time）效率
      4. 平均处理时间 / 平均会话时长（Average Handle Time, AHT） 效率
      5. 解决时间（Time to Resolution / Time to Close）效率
   3. 业务目标指标通过 1/2 对业务目标的影响
      1. **咨询量**，系统异常会导致咨询下跌
      2. **咨询-转化率（Inquiry-to-Order Conversion Rate）** 客户通过客服咨询后，下单的比例高说明客服引导力强，直接带来新增销售
      3. **销售额 / GMV（Gross Merchandise Volume）** 最直接的营收指标，反映整体销售规模。客服若能促成更多订单／提升复购，就会提升这个指标。
      4. **付款成功率（从下单到付款）** 若很多订单被弃单或支付失败，虽有下单但没变现，影响收入。客服可辅助引导或解决支付问题。
2. **技术指标** 系统可观测性能、稳定性、资源消耗、用户体验
   1. **用户体验**
      1. 启动时长
         1. 冷启动时长
         2. 热启动时长
      2. 响应时长
         1. 主进程 ANR
         2. 渲染进程
            1. FCP (首屏时间)
            2. (交互延迟) INP
      3. 卡顿率
         1. 主进程卡顿率, 通过 ANR 可以反应
         2. 渲染进程卡顿率， FPS 采集
      4. 接口延迟 P90
   2. **稳定性**
      1. Crash 率
         1. 主进程 crash 率
         2. 渲染进程 crash 率
      2. 错误率
         1. 主进程错误率
         2. 渲染进程错误率
      3. 接口成功率
   3. **资源消耗**
      1. CPU 利用率， 应该尽可能低
         1. 主进程
         2. 渲染进程
      2. 内存消耗
         1. 主进程
         2. 渲染进程
      3. 电池消耗


## 延伸阅读

* [Electron 质量监控](https://www.youtube.com/watch?v=VO_UScg2PLQ&list=PLQU4z1eHlvG9E5UY9wq16S3XLAAeFzsjv&index=30)
* [Electron 在企业 IM 前端⼯工程实践](https://static001.geekbang.org/con/38/pdf/1042953562/file/Electron%20%E5%9C%A8%E4%BC%81%E4%B8%9A%20IM%20%E5%89%8D%E7%AB%AF%E5%B7%A5%E7%A8%8B%E5%AE%9E%E8%B7%B5-%E9%82%93%E8%80%80%E9%BE%99.pdf)
* [Perf Tools Vscode](https://github.com/microsoft/vscode/wiki/%5BDEV%5D-Perf-Tools-for-VS-Code-Development)
* [Electron QQ](https://cloud.tencent.com/developer/article/2332111)
* [VS Code 是如何优化启动性能的](https://developer.aliyun.com/article/787658)
* [crash 分析](https://developer.aliyun.com/article/787658)