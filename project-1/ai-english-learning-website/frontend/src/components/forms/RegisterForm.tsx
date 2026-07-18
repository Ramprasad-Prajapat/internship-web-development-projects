import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await registerUser(values);
      navigate("/dashboard");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Name
        </label>
        <input
          type="text"
          autoComplete="name"
          placeholder="Your name"
          className="input-base"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-[11px] font-semibold text-rose-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Email Address
        </label>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="input-base"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-[11px] font-semibold text-rose-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className="input-base pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] font-semibold text-rose-600">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-600">
          {serverError}
        </p>
      )}

      <Button type="submit" fullWidth disabled={isSubmitting} className="shadow-md shadow-indigo-600/10">
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}

export default RegisterForm;
