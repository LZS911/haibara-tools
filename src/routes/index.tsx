import { createFileRoute, type LinkProps } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { ConvertIcon } from './-components/svg/convert-icon';
import { AIConvertIcon } from './-components/svg/ai-convert-icon';

export const Route = createFileRoute('/')({
  component: App
});

type ITool = {
  title: string;
  desc: string;
  btn: string;
  icon: React.ReactNode;
  to: LinkProps['to'];
};
const TOOL_LIST: ITool[] = [
  {
    title: i18next.t('tool_file_converter_title'),
    desc: i18next.t('tool_file_converter_desc'),
    btn: i18next.t('tool_file_converter_btn'),
    icon: <ConvertIcon />,
    to: '/convert'
  },
  {
    title: 'AI视频转文档',
    desc: '基于AI大模型，将视频/音频转化为各种风格的文档',
    btn: '开始转换',
    icon: <AIConvertIcon />,
    to: '/media-to-docs'
  }
];

function App() {
  const { t } = useTranslation();

  const renderTool = (tool: ITool) => {
    // 为AI工具使用特殊的渐变色
    const isAITool = tool.to === '/media-to-docs';
    const gradientClass = isAITool
      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
      : 'bg-gradient-to-br from-blue-500 to-purple-600';

    return (
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="h-[130px]">
          <div
            className={`w-12 h-12 ${gradientClass} rounded-lg flex items-center justify-center mb-4`}
          >
            {tool.icon}
          </div>
          <CardTitle className="text-xl">{tool.title}</CardTitle>
          <CardDescription>{tool.desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to={tool.to}>
            <Button className="w-full" size="lg">
              {tool.btn}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  const renderComingSoon = () => {
    return (
      <Card className="opacity-50 hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
              />
            </svg>
          </div>
          <CardTitle className="text-xl">
            {t('tool_coming_soon_title')}
          </CardTitle>
          <CardDescription>{t('tool_coming_soon_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" size="lg" disabled>
            {t('tool_coming_soon_btn')}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          {t('web_title')}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {t('web_desc')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOL_LIST.map((tool, index) => (
          <div key={index}>{renderTool(tool)}</div>
        ))}
        {renderComingSoon()}
        {renderComingSoon()}
      </div>
    </div>
  );
}
