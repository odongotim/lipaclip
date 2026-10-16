# Changes

## Run these migrations in Supabase (in order) BEFORE deploying
1. `supabase/migrations/20261007_campaign_brief_fields.sql` (hashtags, do's, don'ts)
2. `supabase/migrations/20261007_brand_review_and_stats.sql` (public stats RPC, brand approve/reject RPC)
3. `supabase/migrations/20261008_creator_profiles.sql` (creator profiles table, `list_creators()` RPC)
4. `supabase/migrations/20261009_campaign_invites.sql` (invitations table, `invite_creator()` and `respond_to_invite()` RPCs)

## Round 1
- SEO/meta tags, favicon fix, logo path fix
- Landing: pricing, FAQ, campaign types, creator CTA, nav anchors
- New campaign: hashtags, do's/don'ts, views-the-budget-buys estimate

## Round 2
- Landing stats now come from the database (falls back to the old static numbers if the RPC is missing or empty)
- Brands can approve/reject pending videos from their dashboard
- Brand dashboard: total views, average cost per 1,000 views, average views per video per creator
- Creators can filter campaigns by type and sort by pay or budget left

## Round 3: Creator profiles with audience stats
- New creator page `/influencer/profile`: bio, location, categories, followers per platform, average views, audience split (female %, Uganda %, top age) and their LipaClip track record (videos, campaigns, avg views per video, approval rate)
- New brand page `/brand/creators`: directory of verified creators with filters (platform, category, followers, verified stats only) and sorting
- Admin Verifications: shows self-reported stats and a "Verify stats" button
- Audience numbers are self-reported until an admin verifies them. Any creator edit resets that verification.
- Track-record numbers are computed from real submissions, not typed in
- Brands only see creators whose social account is verified. Email and phone are never exposed.

## Round 4: Invite flow
- Brands can invite a verified creator to one of their live campaigns, with an optional note (max 200 characters), from `/brand/creators`
- Creators see invitations at the top of Browse Campaigns and can accept (jumps to the campaign) or decline
- Invited campaigns get an "Invited" badge; brands see each invite's status (pending, accepted, declined) on the creator's card
- Invites are only allowed for the brand's own live campaigns with budget left, and only to verified creators. One invite per creator per campaign.
- Accepting an invite doesn't change earnings or approval rules; the creator still submits videos as usual

## Round 5: UI
- Landing page redesigned around a "payout slip" in the hero: a live calculator showing what a budget buys at a chosen rate (views, service fee from your settings, maximum cost)
- Landing: removed the repeated card grids and uppercase labels. Stats are a single band, process and pricing use open layouts, FAQ uses native expandable rows (keyboard and screen-reader friendly), the creator section is the one dark block
- Added Terms and Privacy links to the footer, `loading="lazy"` on campaign images, progress bars with accessible labels
- New shared `PageLoader` (spinner) replaces the plain "Loading..." text on all 14 pages
- New toast notifications (`src/lib/toast.ts`, `ToastHost`) replace browser `alert()` pop-ups on the creator Browse page. Use `toast('message', 'success' | 'error')` anywhere.

## Round 6: Polish everywhere
**Accessibility and mobile**
- Every static form label is now tied to its field (`htmlFor`/`id`), and error and success banners announce themselves to screen readers
- Text colour on light backgrounds moved from amber-600 to amber-700 for readable contrast; status chips and active sidebar links darkened to match
- Phones no longer zoom the page when a field is focused (inputs are 16px on small screens); number fields lose their spinner arrows; focus rings stay visible on form fields
- Sidebars: `nav` landmark, `aria-current` on the active page, labelled menu buttons
- Login and Signup are real forms (Enter submits, password managers and autofill work), with show/hide password and phone/email keyboards
**Consistency**
- Sentence-case headings and labels across the app; "Influencer" is now "Creator" on signup to match the rest of the product
- Shared components: `StatCard`, `StatusBadge` (one look for live, approved, pending, rejected and so on), `EmptyState` (explains what is missing and offers the next step)
**Brand dashboard**
- "New campaign" button moved to the header; banner when videos are waiting for review; stat cards unified
- Video rows no longer overflow on phones: link on its own line, larger Approve/Reject buttons, Copy link as text
- Labelled delete button, accessible progress bars
**Flow**
- New-campaign flow shows a 3-step progress indicator (Details, Payment, Confirm)
- Page titles per route, scroll to top on navigation, a 404 page, and an error screen instead of a blank page if a page crashes

## Round 7: Password reset, brand colour tokens, favicon
- **Password reset**: "Forgot password?" on Login, `/forgot-password` (email a reset link) and `/reset-password` (choose a new password, with an expired-link screen). In Supabase, add `https://lipaclip.site/reset-password` to Authentication > URL Configuration > Redirect URLs, or the emailed link will be rejected.
- **Brand colour tokens**: every `amber-*` class is now `brand-*`. The ten brand shades live at the top of `src/index.css` under `@theme`. Change those values (and `theme-color` in `index.html`) to re-colour the whole app.
- **Favicon**: the old favicon was the default Vite icon. Replaced with your logo (`public/favicon.png`, `public/apple-touch-icon.png`).

## Round 8: Deep teal brand colour
- Brand palette is now deep teal (main shade `#0f766e`), set in `src/index.css` under `@theme`
- Solid buttons use the 700 shade (hover 800) so white text passes contrast; the 600 shade is used for accents like progress bars and step markers
- `theme-color` in `index.html` updated so the phone browser bar matches

## Round 9: Automatic view tracking
- New edge function `refresh-views` reads public view counts for approved videos in live campaigns (YouTube via the official API, TikTok and others via a configurable data provider) and turns them into earnings
- New migration `20261010_auto_view_tracking.sql`: `apply_submission_views()` is now the single place earnings are calculated, with the campaign budget cap enforced under a database lock (the admin page now uses it too, replacing the old browser-side maths)
- Safety: only approved videos earn; counts never drop automatically; suspicious jumps (50,000+ views and 10x) are flagged for review; failures never zero a video; manual edits lock a video until "Resume auto-tracking"; every check is logged in `view_checks`
- Admin Views page: "Refresh views now", per-video "Check now", tracking status, review flags, and a "Test a link" box to verify the data provider
- Brands and creators see "Views updated X ago" on approved videos
- Setup steps and tuning options: `supabase/functions/refresh-views/README.md`

## Round 10: Google sign-in fix
- Google sign-in now sends admins to `/admin` (it used to send them to the creator page, which bounced them to the home page)
- The callback waits for the session to appear, shows an error if the profile can't be created, and no longer leaves a blank loader
- Safety net: if a sign-in or password-reset link lands on the home page, it is forwarded to `/auth/callback` or `/reset-password`

## Round 11: MoMo payment errors
- The app now shows the real error from an edge function instead of "Edge Function returned a non-2xx status code" (`src/lib/functions.ts`), on brand payment, admin payouts and admin view tracking
- `momo-request-to-pay` rewritten: checks the campaign belongs to the caller and that the amount equals budget plus fee (stops a brand paying less than the campaign costs), records the pending deposit BEFORE the MTN prompt is sent, marks it failed if MTN rejects, always returns JSON with a clear message, logs errors
- Redeploy with: `supabase functions deploy momo-request-to-pay`

## Round 12: Money only counts once payment is complete
- Brand dashboard: stats (funded budget, spent, unspent, active, cost per 1,000 views) now count only paid campaigns (live or completed). Unpaid and failed campaigns appear in a "Waiting for payment" list with "Complete payment" / "Try payment again" and Delete.
- Paid campaigns can no longer be deleted from the dashboard
- `/brand/new-campaign?resume=<id>` resumes payment for an unpaid campaign; if a MoMo prompt was already sent it checks that payment first so the brand is not charged twice
- `momo-request-to-pay` refuses campaigns that are already paid, and resets a failed campaign to pending on retry
- New migration `20261011_protect_campaign_payment.sql`: the database itself now forces new campaigns to start unpaid, blocks brands from setting a campaign live or changing its status, spend or start date, locks budget and rate after payment, and blocks deleting a paid campaign or its payment and video records
- Redeploy: `supabase functions deploy momo-request-to-pay`

## Round 13: MoMo auth errors
- MoMo errors now say the HTTP status, whether the call was made in sandbox or production mode, and MTN's own message
- Production calls now send `X-Target-Environment: mtnuganda` (it was `production`, which MTN does not accept for Uganda); override with the `MOMO_TARGET_ENVIRONMENT` secret
- Status checks no longer crash when MTN answers with plain text
- Redeploy all four MoMo functions (they share this code)

## Phone-friendly deploy
- `supabase/dashboard-paste/`: one-file versions of every MoMo function (shared code inlined) that can be pasted into the Supabase dashboard code editor, no terminal needed

## Round 14: Tabs instead of the sidebar
- Navigation is now tabs: a bottom tab bar on phones and a tab row in the header on desktop (`TabNav`, `BrandNav`, `CreatorNav`, `AdminNav`). Brand: Dashboard, New campaign (highlighted), Creators, Settings. Creator: Browse, Dashboard, Withdraw, Profile. Admin: scrolling tabs with a Log out button in the header.
- "My socials" moved into the creator Profile page (new "Social accounts" section at the top, verification status included). The old `/influencer/socials` address redirects there, and the old page is removed.
- Log out now lives at the bottom of the creator Profile page and the brand Settings page
- Toast messages sit above the phone tab bar

## Round 15: Tab badges
- Brand: the Dashboard tab shows how many videos are waiting for review
- Creator: the Browse tab shows how many invitations are unanswered
- Counts refresh on every page change and live when Realtime is on for `submissions` / `campaign_invites`; any error simply hides the badge

## Round 16: Edge function CORS
- All edge functions now allow the extra request headers the app sends (including `x-application-name`) and list their methods, so the browser's pre-check can't block a call and show "Failed to send a request to the Edge Function"
- One-file versions in `supabase/dashboard-paste/` regenerated to match

## Round 17: MoMo sandbox setup from the admin page
- Admin > Settings has a new "MTN MoMo sandbox setup" box: creates a fresh MoMo API user and key and shows them with Copy buttons (no terminal needed)
- `momo-provision-sandbox` now requires an admin login (before, anyone could call it and receive credentials) and is disabled when MOMO_ENV is production
