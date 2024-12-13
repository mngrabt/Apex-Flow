import { styles } from '../../utils/styleConstants';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center space-x-2">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-2xl font-bold transition-colors ${
            currentPage === page
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}