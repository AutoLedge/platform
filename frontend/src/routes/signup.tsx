// src/routes/signup.tsx
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
  type ActionFunctionArgs,
} from "react-router";
import { supabase } from "@/lib/supabase";

export async function signupAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get("email")),
    password: String(form.get("password")),
    options: {
      // Where the confirmation email's link sends the user
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
  if (error) return { error: error.message, checkEmail: false };

  // Email confirmation off: signed in immediately
  if (data.session) throw redirect("/");

  // Email confirmation on (Supabase's default): no session until they click the link
  return { error: null, checkEmail: true };
}

export default function Signup() {
  const actionData = useActionData<typeof signupAction>();
  const navigation = useNavigation();

  if (actionData?.checkEmail) {
    return <p>Check your email for a confirmation link to finish signing up.</p>;
  }

  return (
    <Form method="post">
      <h1>Create an account</h1>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" minLength={8} required />
      {actionData?.error && <p role="alert">{actionData.error}</p>}
      <button type="submit" disabled={navigation.state === "submitting"}>
        {navigation.state === "submitting" ? "Creating account…" : "Sign up"}
      </button>
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </Form>
  );
}