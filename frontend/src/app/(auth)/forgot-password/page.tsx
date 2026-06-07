"use client";

import { useState, useEffect, useRef } from "react";
import { post } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const codeInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await post("/auth/forgot-password", { email });
      setSuccessMsg("Mã code đã được gửi tới gmail đăng ký của bạn");
      setStep("code");
      setTimer(120);
      setTimeout(() => codeInputsRef.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.body?.message ?? "Gửi mã thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d$/.test(value) && value !== "") return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      codeInputsRef.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 số");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await post("/auth/verify-reset-code", { email, code: fullCode });
      setStep("password");
    } catch (err: any) {
      setError(err.body?.message ?? "Mã xác nhận không đúng");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await post("/auth/reset-password", {
        email,
        code: code.join(""),
        newPassword,
      });
      router.push("/login");
    } catch (err: any) {
      setError(err.body?.message ?? "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError("");
    try {
      await post("/auth/forgot-password", { email });
      setTimer(120);
      setCode(["", "", "", "", "", ""]);
      setSuccessMsg("Mã code đã được gửi lại tới gmail của bạn");
    } catch (err: any) {
      setError(err.body?.message ?? "Gửi lại mã thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-lg border p-8 shadow">
        <h1 className="text-2xl font-bold text-center">Quên mật khẩu</h1>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        {successMsg && step !== "password" && (
          <p className="text-sm text-green-600 text-center">{successMsg}</p>
        )}

        {step === "email" && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <input
              className="rounded border p-2"
              type="email"
              placeholder="Email đăng ký"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              className="rounded bg-blue-600 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang gửi..." : "Gửi mã xác nhận"}
            </button>
            <p className="text-sm text-center text-gray-600">
              <Link href="/login" className="text-blue-600 hover:underline">
                Quay lại đăng nhập
              </Link>
            </p>
          </form>
        )}

        {step === "code" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600 text-center">
              Nhập mã 6 số được gửi đến <strong>{email}</strong>
            </p>

            <div className="flex justify-center gap-2">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeInputsRef.current[i] = el; }}
                  className="h-12 w-10 rounded border text-center text-lg font-bold"
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                />
              ))}
            </div>

            <p className="text-sm text-center text-gray-500">
              {timer > 0 ? (
                <>Mã hết hạn sau: <span className="font-mono font-bold text-red-500">{formatTimer(timer)}</span></>
              ) : (
                <span className="text-red-500">Mã đã hết hạn</span>
              )}
            </p>

            <button
              className="rounded bg-blue-600 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              onClick={handleVerifyCode}
              disabled={loading || code.join("").length !== 6}
            >
              {loading ? "Đang xác nhận..." : "Xác nhận"}
            </button>

            {timer === 0 && (
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={handleResendCode}
                disabled={loading}
              >
                Gửi lại mã
              </button>
            )}
          </div>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <p className="text-sm text-green-600 text-center font-semibold">
              Mã xác nhận chính xác
            </p>

            <input
              className="rounded border p-2"
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <input
              className="rounded border p-2"
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />

            <button
              className="rounded bg-blue-600 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
