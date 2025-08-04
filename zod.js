import z from 'zod'

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long")
})

const registerSchema = userSchema.extend({
  name: z.string().min(3, 'name must be longer'),
  lastname: z.string().min(3, 'lastname must be longer'),
  email: z.string().min(10, 'email must have at least 10 chars'),
  age: z.number().int().min(19, "Age must be major than 18").max(99, 'must be smaller than 100')
})

export const validateUser = (user) => {
  return userSchema.safeParse(user)
}

export const validateRegister = (user) => {
  return registerSchema.safeParse(user)
}