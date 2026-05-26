import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

const Pagination = ({ currentPage, totalPages, onPageChange, isLoading = false }: PaginationProps) => {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(0, currentPage - 2);
        let end = Math.min(totalPages - 1, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(0, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    disabled={isLoading}
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black transition-all ${currentPage === i
                            ? 'bg-lav-dark text-white shadow-lg shadow-lav-dark/20'
                            : 'bg-white text-text-mid hover:bg-lav-50 hover:text-lav-dark border border-lav-100'
                        }`}
                >
                    {i + 1}
                </button>
            );
        }
        return pages;
    };

    return (
        <div className="mt-8 flex items-center justify-center gap-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0 || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-lav-100 bg-white text-text-mid transition-all hover:bg-lav-50 hover:text-lav-dark disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
                {renderPageNumbers()}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-lav-100 bg-white text-text-mid transition-all hover:bg-lav-50 hover:text-lav-dark disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default Pagination;
