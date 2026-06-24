"use client";

import { Icon } from "@iconify/react";

export default function LockedAccountDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-center">
          <Icon icon="material-symbols:lock" className="text-5xl text-red-500 mx-auto mb-4" />
          <h3 className="font-headline-sm font-bold text-on-surface mb-2">Tài khoản đã bị khóa</h3>
          <p className="text-body-md text-on-surface-variant mb-4">
            Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.
          </p>
          <div className="flex flex-col items-center gap-2 mb-6 text-body-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <Icon icon="material-symbols:call" className="text-lg text-primary" />
              <span>0399391400</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="material-symbols:mail" className="text-lg text-primary" />
              <span>dtuvuvu@gmail.com</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full h-10 rounded-full bg-primary text-on-primary text-body-sm font-semibold hover:bg-primary/90 transition-all active:scale-95"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
