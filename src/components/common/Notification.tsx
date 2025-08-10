import { ReactNode } from 'react';

export default function Notification({ children }: { children: ReactNode }) {
  return (
    <div className="fixed top-[20%] right-0 z-10 max-w-[250px] translate-x-[30px] border-l-4 border-red-500 bg-white p-2 opacity-0 shadow-md transition-all duration-400 hover:translate-x-0 hover:opacity-100">
      {children}
    </div>
  );
}
