import { Link } from '@tanstack/react-router';

type Props = {
  children: React.ReactNode;
};

export const Layout: React.FC<Props> = ({ children }) => {
  // const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <Link to="/" className="text-xl font-semibold text-slate-900">
                Haibara Tools
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              {/* <Link
                to="/"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                {t('home')}
              </Link>
              <Link
                to="/convert"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                {t('tool_file_converter_title')}
              </Link> */}
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};
