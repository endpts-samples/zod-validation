import { z, ZodError } from "zod";
import { randomUUID } from "crypto";

import type { Route } from "@endpts/types";

const userSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .min(1, "Name cannot be empty")
      .max(50, "Name cannot be longer than 50 characters"),
    email: z.string({ required_error: "Email is required" }).email(),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters"),
    role: z.enum(["admin", "developer", "user"], {
      errorMap: () => ({
        message: "Role must be one of 'admin', 'developer', or 'user'",
      }),
    }),
  })
  .strict();

type User = z.infer<typeof userSchema>;
const userResponseSchema = userSchema
  .extend({
    id: z.string(),
  })
  .omit({ password: true });
type UserResponse = z.infer<typeof userResponseSchema>;

function createUser(user: User): UserResponse {
  const id = randomUUID();

  // hash the user's password and create the new user in the database here...

  return { id, name: user.name, email: user.email, role: user.role };
}

export default {
  method: "POST",
  path: "/signup",
  async handler(req) {
    // read the request body as JSON
    const body = await req.json();

    // validate the request body against the schema
    let user;
    try {
      user = userSchema.parse(body);
    } catch (err: any) {
      // return a 400 response if the request body is invalid
      if (err instanceof ZodError) {
        return Response.json(
          err.issues.map((e) => ({ property: e.path[0], message: e.message })),
          { status: 400 }
        );
      }

      return new Response("An unknown error occured", { status: 500 });
    }

    return Response.json(createUser(user));
  },
} satisfies Route;
