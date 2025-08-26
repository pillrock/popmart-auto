import { SettingsIcon } from 'lucide-react';
import { usePopMartAuto } from '../../contexts/PopmartAuto';
import { useEffect, useState } from 'react';
import ModalOriginal from '../common/ModalOriginal';

function Setting() {
  const { isBrowserRuning, setSettings_save, settings } = usePopMartAuto();

  console.log('settings: ', settings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div
        onClick={() => {
          if (isBrowserRuning) return;
          setIsModalOpen(true);
        }}
        className={` ${isBrowserRuning ? '!cursor-no-drop opacity-30' : 'hover:opacity-80'} bt cursor-pointer bg-gray-300 p-2 text-white`}
      >
        <SettingsIcon size={20} className="text-gray-600" />
      </div>
      {isModalOpen && (
        <ModalOriginal
          onClose={() => {
            setIsModalOpen(false);
          }}
          width="60%"
        >
          <h1 className="mb-2 border-b border-blue-400 text-xl">TINH CHỈNH</h1>
          {!settings ? (
            <div>Không tìm thấy cấu hình</div>
          ) : (
            <div>
              <div className="group flex items-center justify-between gap-x-2 border border-gray-300 p-1 hover:bg-gray-300">
                <p className="flex-1">Thời gian chờ giữa các lần quét</p>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex flex-row">
                    <p className="p-1 text-blue-500 group-hover:bg-white">
                      {settings.waitTime}
                    </p>
                    <p className="p-1">mili giây</p>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={3000}
                    step={100}
                    value={settings.waitTime}
                    onChange={(e) =>
                      setSettings_save({
                        ...settings,
                        waitTime: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </ModalOriginal>
      )}
    </>
  );
}

export default Setting;
