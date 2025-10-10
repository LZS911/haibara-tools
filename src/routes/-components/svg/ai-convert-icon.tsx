// AI转换工具图标组件

import type { SVGProps } from 'react';

export function AIConvertIcon({
  size = 24,
  className = '',
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* 背景圆圈 */}
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="url(#aiGradient)"
        stroke="currentColor"
        strokeWidth="0.5"
      />

      {/* AI大脑/神经网络图案 */}
      <g transform="translate(12,12)">
        {/* 中心节点 */}
        <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.9" />

        {/* 放射状连接线 */}
        <g stroke="white" strokeWidth="0.8" opacity="0.7">
          <line x1="0" y1="0" x2="0" y2="-6" />
          <line x1="0" y1="0" x2="4.24" y2="-4.24" />
          <line x1="0" y1="0" x2="6" y2="0" />
          <line x1="0" y1="0" x2="4.24" y2="4.24" />
          <line x1="0" y1="0" x2="0" y2="6" />
          <line x1="0" y1="0" x2="-4.24" y2="4.24" />
          <line x1="0" y1="0" x2="-6" y2="0" />
          <line x1="0" y1="0" x2="-4.24" y2="-4.24" />
        </g>

        {/* 外围节点 */}
        <g fill="white" opacity="0.8">
          <circle cx="0" cy="-6" r="1" />
          <circle cx="4.24" cy="-4.24" r="1" />
          <circle cx="6" cy="0" r="1" />
          <circle cx="4.24" cy="4.24" r="1" />
          <circle cx="0" cy="6" r="1" />
          <circle cx="-4.24" cy="4.24" r="1" />
          <circle cx="-6" cy="0" r="1" />
          <circle cx="-4.24" cy="-4.24" r="1" />
        </g>

        {/* 脉冲效果 */}
        <circle
          cx="0"
          cy="0"
          r="2"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          opacity="0.3"
        >
          <animate
            attributeName="r"
            values="2;4;2"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* 媒体播放图标叠加 */}
      <g transform="translate(16,16)" opacity="0.9">
        <circle cx="0" cy="0" r="3" fill="white" />
        <polygon points="-1,-1.5 -1,1.5 1.5,0" fill="url(#aiGradient)" />
      </g>

      {/* 渐变定义 */}
      <defs>
        <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default AIConvertIcon;
