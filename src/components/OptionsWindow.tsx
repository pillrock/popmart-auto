import { MinusIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OptionsWindow() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    (async () => {
      const v = await window.electronAPI.ipcRenderer.invoke('get-app-version');
      setVersion(v as string);
    })();
  }, []);
  return (
    <div className="app-region-drag fixed top-0 flex w-full items-center justify-between gap-x-4 bg-[#E8DFEE] pl-2">
      <div>{`POPAUTO - v${version}`}</div>
      <div className="justify-en app-region-no-drag flex">
        <span
          onClick={() => {
            window.electronAPI.ipcRenderer.send('window-control', 'minimize');
          }}
          className="bt p-2"
        >
          <MinusIcon size={19} strokeWidth={1.5} />
        </span>
        <span
          onClick={() => {
            window.electronAPI.ipcRenderer.send('window-control', 'close');
          }}
          className="bt p-2 hover:!bg-red-500 hover:text-white"
        >
          <XIcon size={19} strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}
