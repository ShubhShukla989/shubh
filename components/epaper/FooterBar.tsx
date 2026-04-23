// components/epaper/FooterBar.tsx
import { ChevronRight, ChevronLeft, FileText, Scissors, Calendar } from "lucide-react";

interface FooterBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onClipToggle: () => void;
  onDownload: () => void;
  onCalendar: () => void;
  isClipping?: boolean;
}

const FooterBar = ({
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPrevPage,
  onClipToggle,
  onDownload,
  onCalendar,
  isClipping = false
}: FooterBarProps) => {
  // Generate page options for select
  const pageOptions = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onPageChange(parseInt(event.target.value));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white flex items-center justify-between z-50 border-t-2 border-gray-300" 
         style={{ 
           height: '64px',
           padding: '0 8px' // Reduced padding for mobile
         }}>
      
      {/* Left side - Navigation Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Page Button */}
        <button 
          className="w-12 h-12 bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          style={{ borderRadius: '8px' }}
          title="Previous Page"
        >
          <ChevronLeft className="w-5 h-5 text-gray-900" />
        </button>

        {/* Page Selector */}
        <select 
          value={currentPage} 
          onChange={handleSelectChange}
          className="h-12 bg-white border-2 border-gray-300 text-gray-900 px-2 font-semibold"
          style={{ 
            width: '90px', // Reduced width for mobile
            fontSize: '14px', // Smaller font for mobile
            borderRadius: '8px'
          }}
        >
          {pageOptions.map((page) => (
            <option key={page} value={page} style={{ fontSize: '14px' }}>
              {page}
            </option>
          ))}
        </select>

        {/* Page Counter */}
        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
          / {totalPages}
        </span>
                
        {/* Next Page Button */}
        <button 
          className="w-12 h-12 bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
          style={{ borderRadius: '8px' }}
          title="Next Page"
        >
          <ChevronRight className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2">
        <button 
          className="w-12 h-12 bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors border-2 border-orange-500"
          onClick={onDownload}
          style={{ borderRadius: '8px' }}
          title="Download PDF"
        >
          <FileText className="w-5 h-5 text-white" />
        </button>

        <button 
          className={`w-12 h-12 flex items-center justify-center transition-colors border-2 ${
            isClipping 
              ? 'bg-green-500 hover:bg-green-600 border-green-500' 
              : 'bg-blue-500 hover:bg-blue-600 border-blue-500'
          }`}
          onClick={onClipToggle}
          style={{ borderRadius: '8px' }}
          title={isClipping ? "Stop Clipping" : "Start Clipping"}
        >
          <Scissors className="w-5 h-5 text-white" />
        </button>

        <button 
          className="w-12 h-12 bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors border-2 border-red-600"
          onClick={onCalendar}
          style={{ borderRadius: '8px' }}
          title="Archive"
        >
          <Calendar className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};
export default FooterBar;