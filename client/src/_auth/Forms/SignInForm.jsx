import React, { useState } from "react";
import * as z from "zod";
import Button  from "@/components/ui/buttonloading";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "@/components/shared/Loader";
import API from "../../lib/axios";
import domparser from "../../lib/domparser";

// Define the validation schema with Zod
const SignInValidation = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 6 characters long"),
});

const SignInForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error,setError]=useState("")
  const navigate=useNavigate()
  const form = useForm({
    resolver: zodResolver(SignInValidation),
    defaultValues: {
      email: "",
      password: ""
    },
  });

  async function onSubmit(values) {
    // Handle form submission
    // Simulate an async action
    try {
      setIsLoading(true)
      const res=await API.post("/users/login",{
        email:values.email,
        password:values.password
      })
      console.log("responese is: ",res)
      setIsLoading(false)
      navigate("/")
    } catch (err) {
      const errorMessage=domparser(err)
      setError(errorMessage);
      setIsLoading(false)
      console.log(error)
    }

  }

  return (
    <Form {...form} >
      <div className="sm:w-420 flex-center flex-col ">
        <img src="/assets/images/logo.svg" alt="logo" />

        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
          Log in to your account
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          To use Infinite Media, Please enter your details
        </p>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col  w-full mt-4">

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Email</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Password</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error?(<p className="text-red-600">{error}</p>):<></>}
          <Button type="submit" loading={isLoading}  className="shad-button_primary">            
            Login
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2">
            Don't have an account?
            <Link
              to="/sign-up"
              className="text-primary-500 text-small-semibold ml-1">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SignInForm;
