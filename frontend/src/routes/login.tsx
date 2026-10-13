import {
  Form,
  redirect,
  useActionData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
} from "react-router";
import { supabase } from "@/lib/supabase";
import { safeRedirect } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";

export async function loginAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error) return { error: error.message };
  queryClient.clear(); // start each session with an empty cache
  throw redirect(safeRedirect(form.get("from")));
}

export default function Login() {
  const actionData = useActionData<typeof loginAction>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  return (
    <Form method="post">
      <h1>Sign in</h1>
      <input type="hidden" name="from" value={searchParams.get("from") ?? "/"} />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      {actionData?.error && <p role="alert">{actionData.error}</p>}
      <button type="submit" disabled={navigation.state === "submitting"}>
        {navigation.state === "submitting" ? "Signing in…" : "Sign in"}
      </button>
    </Form>
  );
}