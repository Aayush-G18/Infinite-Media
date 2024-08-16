import * as z from "zod"
import API from "../../lib/axios.js"
// import API from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import {Form,FormControl,FormField,FormItem,FormLabel,  FormMessage,} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SignupValidation } from "@/lib/validation"
import { Link } from "react-router-dom"
import { Loader } from "@/components/shared/Loader"
import { useState } from "react"


const SignUpForm = () => {  
  // const [isLoading,setIsLoading]=useState(false)
  const[error,setError]=useState("")
  const form = useForm({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      fullName:"",
      userName: "",
      email:"",
      password:"",
      avatar:undefined
    },
  })
  // 2. Define a submit handler.
  async function onSubmit(values) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    try {
      const res = await API.post("/users/register", {
        fullName:values.fullName,
        userName: values.userName,
        email:values.email,
        password:values.password,
        avatar:values.avatar[0]
      },{
        headers:{
          "Content-Type":"multipart/form-data"
        }
      });
      console.log("response is: ", res);
  } catch (err) {
      setError(err?.message);
      console.log(error)
  }
}
  return (
    <Form {...form} >
      <div className="sm:w-420 flex-center flex-col ">
        <img src="/assets/images/logo.svg" alt="logo" />

        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
          Create a new account
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          To use Infinite Media, Please enter your details
        </p>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col  w-full mt-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Name</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">UserName</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
          <FormField
            control={form.control}
            name="avatar"
            render={({ field}) => (
              <FormItem>
                <FormLabel className="shad-form_label">Avatar</FormLabel>
                <FormControl>
                  <Input type="file" id="picture" className="shad-input" onChange={(e)=>{
                    field.onChange(e.target.files)
                  }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="shad-button_primary">
            {/* {isLoading ?(<div className="flex-center gap-2"><Loader/> Loading...</div>):"Sign Up"} */}
            {error?(<p>error:{error}</p>):"Sign-up"}
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2">
            Already have an account?
            <Link
              to="/sign-in"
              className="text-primary-500 text-small-semibold ml-1">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SignUpForm