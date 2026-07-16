import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, KeyRound, CheckCircle2, ArrowLeft, ShieldAlert } from "lucide-react";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

export function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 800);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code !== "123456") {
      setError("Invalid verification code. Please use code 123456.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-800 tracking-tight">
            <span className="rounded-xl bg-indigo-600 p-2 text-white shadow-md shadow-indigo-600/10">
              <GraduationCap size={20} />
            </span>
            English Daily
          </Link>
        </div>

        <Card className="p-6 sm:p-8 border border-slate-100/80 shadow-md">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight sm:text-2xl">Reset Password</h1>
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  Enter your email address to receive a mock verification code.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-base pl-9"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 border border-rose-100">
                    {error}
                  </p>
                )}

                <Button type="submit" fullWidth disabled={isLoading}>
                  {isLoading ? "Sending code..." : "Send Verification Code"}
                </Button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight sm:text-2xl">Verify & Reset</h1>
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  Enter the verification code sent to <span className="font-semibold text-slate-700">{email}</span>.
                </p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs font-semibold text-amber-800">
                💡 Tip: Use verification code <span className="font-extrabold underline">123456</span> to reset mock credentials.
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="input-base tracking-wider text-center font-bold text-base"
                    maxLength={6}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <KeyRound size={16} />
                    </span>
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-base pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <KeyRound size={16} />
                    </span>
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-base pl-9"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 border border-rose-100">
                    {error}
                  </p>
                )}

                <Button type="submit" fullWidth disabled={isLoading}>
                  {isLoading ? "Saving changes..." : "Reset Password"}
                </Button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight sm:text-2xl">Password Reset Successfully</h1>
                <p className="text-xs font-medium text-slate-500">
                  Your mock credentials have been successfully updated.
                </p>
              </div>
              <Link to="/login" className="block">
                <Button fullWidth>Return to Login</Button>
              </Link>
            </div>
          )}

          {step !== 3 && (
            <div className="mt-6 border-t border-slate-100 pt-4 text-center">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                <ArrowLeft size={13} /> Back to Login
              </Link>
            </div>
          )}
        </Card>

        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white/70 p-3 shadow-sm select-none">
          <ShieldAlert size={16} className="text-slate-400 shrink-0" />
          <span className="text-[10px] font-semibold text-slate-400 leading-normal">
            This is a mock reset flow. Real reset will be added with backend later.
          </span>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
