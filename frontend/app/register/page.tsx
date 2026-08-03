"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthButton from "@/components/auth/AuthButton";

import { registerSchema } from "@/schemas/authSchema";
import useAuth from "@/hooks/useAuth";


type RegisterForm = z.infer<typeof registerSchema>;


export default function RegisterPage() {

  const router = useRouter();

  const { register: registerUser, loading } = useAuth();


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });



  const onSubmit = async (
    data: RegisterForm
  ) => {

    try {

      await registerUser(
        data.name,
        data.email,
        data.phone,
        data.password
      );


      router.push("/login");


    } catch (error:any) {

      console.error(
        error?.response?.data?.message ||
        error.message
      );

    }

  };



  return (

    <AuthLayout

      title="Create Account"

      subtitle="Join AbuPay and start making secure payments"

    >

      <AuthCard>


        <form

          onSubmit={
            handleSubmit(onSubmit)
          }

          className="space-y-3"

        >


          <AuthInput

            label="Full Name"

            placeholder="Enter your full name"

            {...register("name")}

            error={
              errors.name?.message
            }

          />



          <AuthInput

            label="Email Address"

            type="email"

            placeholder="example@email.com"

            {...register("email")}

            error={
              errors.email?.message
            }

          />



          <AuthInput

            label="Phone Number"

            placeholder="08012345678"

            {...register("phone")}

            error={
              errors.phone?.message
            }

          />



          <PasswordInput

            label="Password"

            placeholder="Create password"

            {...register("password")}

            error={
              errors.password?.message
            }

          />



          <PasswordInput

            label="Confirm Password"

            placeholder="Repeat password"

            {...register("confirmPassword")}

            error={
              errors.confirmPassword?.message
            }

          />



          <AuthButton

            loading={loading}

          >

            Create Account

          </AuthButton>



          <p className="pt-4 text-center text-sm text-gray-600">


            Already have an account?


            <Link

              href="/login"

              className="ml-1 font-semibold text-blue-600 hover:underline"

            >

              Login

            </Link>


          </p>



        </form>


      </AuthCard>


    </AuthLayout>

  );

}