import { MailIcon, Lock, BellIcon } from 'lucide-react';
import { usePopMartAuto } from '../../contexts/PopmartAuto';

export default function AccountSet() {
  const {
    accountInput,
    setAccountInput,
    isBrowserRuning,
    isManualLogin,
    setIsManualLogin,
  } = usePopMartAuto();
  return (
    <div className="max-h-min space-y-2 p-2 shadow-xl">
      <h1 className="text-base">TÀI KHOẢN POPMART (JP)</h1>
      <div
        onClick={() => {
          setIsManualLogin(!isManualLogin);
        }}
        className="flex cursor-pointer items-center justify-between border border-gray-300 p-2"
      >
        <p>Đăng nhập thủ công</p>
        <div
          className={`relative transition-all duration-300 ${isManualLogin && 'bg-blue-400'} aspect-square h-[20px] w-[40px] rounded-full border-2 border-blue-400`}
        >
          <div
            className={`transition-all duration-300 ${isManualLogin ? 'translate-x-[21px] bg-white' : 'translate-x-[1px]'} absolute aspect-square h-[15px] w-[15px] translate-y-[.5px] rounded-full bg-blue-400`}
          ></div>
        </div>
      </div>
      <div
        className={`group flex items-center border border-gray-300 bg-white p-2 transition-all focus-within:border-blue-400`}
      >
        <MailIcon
          size={20}
          className="mr-2 text-gray-500 transition-all group-focus-within:text-blue-400"
        />
        <input
          type="email"
          placeholder="Email"
          readOnly={isBrowserRuning}
          value={accountInput.email}
          onChange={(e) =>
            setAccountInput((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
          className={`w-full ${isBrowserRuning && 'cursor-no-drop'} outline-none`}
        />
      </div>

      <div className="group flex items-center border border-gray-300 bg-white p-2 transition-all focus-within:border-blue-400">
        <Lock
          size={20}
          className="mr-2 text-gray-500 transition-all group-focus-within:text-blue-400"
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={accountInput.password}
          readOnly={isBrowserRuning}
          onChange={(e) =>
            setAccountInput((prev) => ({
              ...prev,
              password: e.target.value,
            }))
          }
          className={`w-full ${isBrowserRuning && 'cursor-no-drop'} outline-none`}
        />
      </div>
      <div className="mx-5 border-b border-gray-200"></div>
      <div className="group flex items-center border border-gray-300 bg-white p-2 transition-all focus-within:border-blue-400">
        <BellIcon
          size={20}
          className="mr-2 text-gray-500 transition-all group-focus-within:text-blue-400"
        />
        <input
          type="text"
          placeholder="Email nhận thông báo"
          readOnly={isBrowserRuning}
          value={accountInput.emailRecieveNoti}
          onChange={(e) =>
            setAccountInput((prev) => ({
              ...prev,
              emailRecieveNoti: e.target.value,
            }))
          }
          className={`w-full ${isBrowserRuning && 'cursor-no-drop'} outline-none`}
        />
      </div>
    </div>
  );
}
