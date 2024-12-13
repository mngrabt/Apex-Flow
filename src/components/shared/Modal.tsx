import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ 
  title, 
  onClose, 
  children,
  size = 'md'
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  }[size];

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            ref={modalRef}
            className={`
              w-full ${sizeClasses} 
              bg-white
              rounded-2xl shadow-xl
              transform transition-all duration-200
              animate-modal-enter
              divide-y divide-gray-100
            `}
          >
            {/* Compact header */}
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900 leading-none">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="
                  -mr-1 p-1.5
                  rounded-full
                  text-gray-400 hover:text-gray-500
                  hover:bg-gray-100
                  transition-all duration-200
                "
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content with adjusted padding */}
            <div className="p-5">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}