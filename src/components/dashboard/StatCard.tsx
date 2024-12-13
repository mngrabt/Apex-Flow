interface StatCardProps {
  title: string;
  count: number;
  onClick: () => void;
}

export default function StatCard({ title, count, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/20 
                shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white/20 to-transparent opacity-0 
                    group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col items-start">
          <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            {count}
          </span>
          <span className="mt-1 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
}