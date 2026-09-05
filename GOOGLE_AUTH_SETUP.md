# Google Sign-In & Email Verification setup

Two things need to be turned on in your Supabase project for this to work —
the code is already in place, but neither feature does anything until you
configure it.

## 1. Google Sign-In

**In Google Cloud Console** (https://console.cloud.google.com):
1. Create (or pick) a project → **APIs & Services → Credentials**.
2. Create an **OAuth client ID** → Application type: **Web application**.
3. Under **Authorized redirect URIs**, add:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   (find `<your-project-ref>` in your Supabase project URL — it's the same
   `flfpwpexcuegauzoldel`-style string you've been using for edge functions).
4. Copy the **Client ID** and **Client Secret** it gives you.

**In Supabase Dashboard:**
1. Go to **Authentication → Providers → Google**.
2. Toggle it **on**, paste in the Client ID and Client Secret from above.
3. Save.
4. Go to **Authentication → URL Configuration** and add your site's URL to
   **Redirect URLs** (e.g. `https://lipaclip.site/auth/callback` — and
   `http://localhost:5173/auth/callback` too if you test locally).

Once both are set, "Continue with Google" on Signup and Login will work.
New users are asked to pick Brand or Influencer *before* they're sent to
Google — that choice is what creates their profile with the right role when
they land back on `/auth/callback`.

## 2. Email verification for manual sign-ups

**In Supabase Dashboard:**
1. Go to **Authentication → Providers → Email**.
2. Make sure **Confirm email** is turned **ON**.
3. Optionally customize the confirmation email template under
   **Authentication → Email Templates → Confirm signup**.

With this on, someone who signs up with email/password sees a "Check your
email" screen instead of being dropped straight into the app — they can only
log in after clicking the confirmation link.

If **Confirm email** is left off, sign-up still works exactly as before
(no verification step) — the app checks for a session and skips the
"check your email" screen automatically when one already exists.
