```tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { loginSchema } from "@/schemas/authSchema";
import useAuth from "@/hooks/useAuth";


type LoginForm = z.infer<typeof loginSchema>;


export default function LoginPage() {

  const router = useRouter();

  const { login, loading } = useAuth();


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });


  const onSubmit = async (data: LoginForm) => {

    try {

      const response = await login(
        data.email,
        data.password
      );


      localStorage.setItem(
        "user",
        JSON.stringify(response.user)
      );


      router.push("/dashboard");


    } catch (error: any) {

      console.error(
        error.response?.data?.message ||
        error.message ||
        "Login failed"
      );

    }

  };


  return (

    <div className="flex min-h-screen items-center justify-center bg-gray-100">

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md rounded-lg bg-white p-8 shadow"
      >

        <h1 className="mb-6 text-center text-3xl font-bold">
          Login
        </h1>


        <input
          type="email"
          placeholder="Email"
          className="mb-2 w-full rounded border p-3"
          {...register("email")}
        />


        {errors.email && (
          <p className="mb-3 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}



        <input
          type="password"
          placeholder="Password"
          className="mb-2 w-full rounded border p-3"
          {...register("password")}
        />


        {errors.password && (
          <p className="mb-3 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}



        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 p-3 text-white hover:bg-blue-700"
        >

          {loading ? "Logging in..." : "Login"}

        </button>


      </form>

    </div>

  );
}
```
