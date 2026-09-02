<template>
  <div class="orbit-hero" aria-hidden="true">
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(120 120)">
        <!-- 三条交叉轨道 -->
        <ellipse rx="96" ry="40" class="orbit" />
        <ellipse rx="96" ry="40" class="orbit" transform="rotate(60)" />
        <ellipse rx="96" ry="40" class="orbit" transform="rotate(120)" />

        <!-- 原子核 -->
        <circle r="14" class="nucleus" />

        <!-- 电子：沿轨道缓慢运动 -->
        <g>
          <circle r="5" class="electron">
            <animateMotion dur="12s" repeatCount="indefinite" path="M 96 0 A 96 40 0 1 1 -96 0 A 96 40 0 1 1 96 0" />
          </circle>
          <circle r="5" class="electron" transform="rotate(60)">
            <animateMotion dur="17s" repeatCount="indefinite" path="M 96 0 A 96 40 0 1 1 -96 0 A 96 40 0 1 1 96 0" />
          </circle>
          <circle r="5" class="electron" transform="rotate(120)">
            <animateMotion dur="9s" repeatCount="indefinite" path="M -96 0 A 96 40 0 1 1 96 0 A 96 40 0 1 1 -96 0" />
          </circle>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.orbit {
  stroke: var(--vp-c-brand-3, #00b8d9);
  stroke-width: 1.6;
  opacity: 0.55;
}

.nucleus {
  fill: var(--vp-c-text-1, #1a2e35);
  animation: nucleus-pulse 4s ease-in-out infinite;
}

@keyframes nucleus-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
}

.electron {
  fill: var(--copper, #b26a2c);
}

.orbit-hero {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}

@media (prefers-reduced-motion: reduce) {
  .nucleus {
    animation: none;
  }
}
</style>
