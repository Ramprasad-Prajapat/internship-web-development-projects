import { Link } from "react-router-dom";
import { GraduationCap, ShieldAlert } from "lucide-react";
import RegisterForm from "../components/forms/RegisterForm";
import Card from "../components/common/Card";

export default function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-800 tracking-tight"
          >
            <span className="rounded-xl bg-indigo-600 p-2 text-white shadow-md shadow-indigo-600/10">
              <GraduationCap size={20} />
            </span>
            English Daily
          </Link>
        </div>

        <Card className="p-6 sm:p-8 border border-slate-100/80 shadow-md">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight sm:text-2xl">
              Start learning today 🚀
            </h1>
            <p className="mt-1.5 text-xs font-medium text-slate-500">
              Create a free account. No payment, no stress — just daily practice.
            </p>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-xs font-semibold text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Login
            </Link>
          </p>
        </Card>

        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white/70 p-3 shadow-sm select-none">
          <ShieldAlert size={16} className="text-slate-400 shrink-0" />
          <span className="text-[10px] font-semibold text-slate-400 leading-normal">
            Admin accounts are managed separately and cannot be created here.
          </span>
        </div>
      </div>
    </div>
  );
}
