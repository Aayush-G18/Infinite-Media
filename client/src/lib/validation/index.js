import * as z from "zod";

export const SignupValidation = z.object({
  fullName: z.string().min(2, { message: "Too short" }),
  userName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  avatar:z.instanceof(FileList).optional()
});

export const SignInValidation = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});
