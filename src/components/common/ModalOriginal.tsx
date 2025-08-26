import { XIcon } from 'lucide-react';

function ModalOriginal({
  children,
  onClose,
  width = 'full',
}: {
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
}) {
  return (
    <div
      className="bg-opacity-70 fixed inset-0 z-100 flex items-center justify-center bg-black/40 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      <div
        className={`mx-4 w-[${width}] scale-100 transform bg-white p-6 shadow-2xl transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center bg-gray-100 text-gray-600 transition-colors duration-200 hover:text-gray-900"
        >
          <span className="text-2xl font-medium">
            <XIcon size={20} />
          </span>
        </button>
        {children}
      </div>
    </div>
  );
}

export default ModalOriginal;
