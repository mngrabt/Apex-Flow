import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PermissionLimitedProps {
  title?: string;
  message?: string;
}

export default function PermissionLimited({ 
  title = 'Доступ ограничен',
  message = 'У вас нет прав для просмотра этой страницы'
}: PermissionLimitedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 py-32">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 pointer-events-none">
            <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400" />
            <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-primary" />
          </div>

          <div className="relative">
            {/* Content */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-8">
                <ShieldAlert className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-semibold text-gray-900 mb-3">
                {title}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {message}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 h-12 px-6 bg-white text-gray-900 rounded-xl border border-gray-200 
                         hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Вернуться назад</span>
              </button>
            </div>

            {/* Decorative Elements */}
            <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
              <svg
                className="relative left-[calc(50%+3rem)] h-[21.1875rem] max-w-none -translate-x-1/2 sm:left-[calc(50%+36rem)] sm:h-[42.375rem]"
                viewBox="0 0 1155 678"
              >
                <path
                  fill="url(#ecb5b0c9-546c-4772-8c71-4d3f06d544bc)"
                  fillOpacity=".3"
                  d="M317.219 518.975L203.852 678 0 438.341l317.219 80.634 204.172-286.402c1.307 132.337 45.083 346.658 209.733 145.248C936.936 126.058 882.053-94.234 1031.02 41.331c119.18 108.451 130.68 295.337 121.53 375.223L855 299l21.173 362.054-558.954-142.079z"
                />
                <defs>
                  <linearGradient
                    id="ecb5b0c9-546c-4772-8c71-4d3f06d544bc"
                    x1="1155.49"
                    x2="-78.208"
                    y1=".177"
                    y2="474.645"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#9089FC" />
                    <stop offset={1} stopColor="#FF80B5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 