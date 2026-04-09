

## Plan: Replace Resend with Nodemailer SMTP (Gmail)

### What changes

1. **Rewrite the `send-round2-email` Edge Function** to use Deno's built-in SMTP capabilities instead of the Resend connector gateway. Since Deno Edge Functions cannot use Node.js `nodemailer`, we will use raw SMTP via the `denomailer` library (Deno-native SMTP client) to connect to Gmail SMTP.

2. **Store SMTP credentials as secrets** — four new secrets:
   - `SMTP_HOST` → `smtp.gmail.com`
   - `SMTP_PORT` → `587`
   - `SMTP_USER` → `zenthorix2k26@gmail.com`
   - `SMTP_PASS` → the app password you provided

3. **Update the Edge Function** (`supabase/functions/send-round2-email/index.ts`):
   - Remove all Resend/gateway references
   - Import `SMTPClient` from `denomailer`
   - Connect to Gmail SMTP with the stored credentials
   - Send the same styled HTML email with the Round 2 invitation
   - Keep the same request/response interface so no client code changes are needed

4. **No changes needed** in `src/lib/quizStore.ts` or `AdminDashboard.tsx` — the function signature stays the same.

5. **Optionally disconnect Resend connector** if no longer needed.

### Technical details

The Edge Function will use:
```
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";
```

This connects to `smtp.gmail.com:587` with STARTTLS, authenticates with the app password, and sends the HTML email directly — no third-party email API needed.

