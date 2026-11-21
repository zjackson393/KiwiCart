import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KiwiCart | Privacy Policy",
  description: "How KiwiCart collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-kcCreamLight text-kcGreenDark">

      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl rounded-2xl border border-kcCreamMedium bg-white/80 p-8 shadow-[0_12px_40px_rgba(32,58,20,0.08)] sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-kcGreenDark-70">Last updated: 17 July 2026</p>

          <div className="mt-8 space-y-8 text-sm leading-6 sm:text-base sm:leading-7">
            <section>
              <h2 className="text-lg font-semibold">1. Overview</h2>
              <p className="mt-2">
                KiwiCart (&ldquo;KiwiCart&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a grocery
                price-comparison and shopping-route tool for New Zealand supermarkets. This policy
                explains what information KiwiCart collects when you use kiwicart.app, how it&apos;s
                used, and the choices you have. It&apos;s written to satisfy Google&apos;s
                requirement that we tell you how your data is processed and protected when you sign
                in with Google.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">2. Information we collect</h2>
              <p className="mt-2">When you sign in with Google, we receive and store:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Your Google account ID, name, and email address.</li>
                <li>An authentication session, kept in an HttpOnly cookie in your browser.</li>
              </ul>
              <p className="mt-2">
                We do not request or receive your Google password, and we only ask for the minimum
                Google scopes needed to identify you (<code>openid email profile</code>), we
                cannot read your Gmail, Drive, Contacts, or any other Google data.
              </p>
              <p className="mt-2">
                Your grocery list, searches, and selected route are kept in our servers so that
                they can be accessed across devices and browsers. We don&apos;t share this data with
                third parties.
              </p>
              <p className="mt-2">
                Like most web services, our infrastructure providers automatically log standard
                technical data (IP address, browser type, request timestamps) for security and
                debugging. We don&apos;t use this for tracking or advertising.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">3. How we use your information</h2>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>To sign you in and keep you signed in across visits.</li>
                <li>To personalise your session (e.g. displaying your name).</li>
                <li>To maintain and secure the service, and diagnose faults.</li>
              </ul>
              <p className="mt-2">
                We do not sell your information, and we do not use it for advertising or share it
                with data brokers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">4. Third parties we rely on</h2>
              <p className="mt-2">
                KiwiCart is built on top of a small number of external services, each of which
                processes a limited slice of data to make the app work:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>
                  <span className="font-medium">Google</span>, for sign-in
                  (authentication only).
                </li>
                <li>
                  <span className="font-medium">Supabase</span>, hosts our database (account
                  records), on servers located in Australia.
                </li>
                <li>
                  <span className="font-medium">grocer.nz</span>, the source of store and
                  product pricing data shown in the app.
                </li>
                <li>
                  <span className="font-medium">OpenStreetMap / Nominatim</span>, used to
                  look up store locations for route planning. Only store names/addresses are sent,
                  never your personal details.
                </li>
                <li>
                  <span className="font-medium">OSRM</span> (Open Source Routing Machine),
                  calculates driving routes between stores using coordinates only.
                </li>
                <li>
                  <span className="font-medium">Vercel</span>, hosts the KiwiCart web app.
                </li>
              </ul>
              <p className="mt-2">
                Each of these providers has its own privacy policy governing how it handles data on
                our behalf.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">5. Cookies</h2>
              <p className="mt-2">
                We use one essential, HttpOnly authentication cookie to keep you signed in. It
                can&apos;t be read by JavaScript and is only sent to KiwiCart&apos;s own servers. We
                don&apos;t use analytics, advertising, or third-party tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">6. Data retention &amp; security</h2>
              <p className="mt-2">
                We keep your account record (Google ID, name, email) for as long as you have an
                account with KiwiCart, and delete it if you ask us to (see Section 8). Authentication
                sessions expire automatically after a short period of inactivity. We use HTTPS
                everywhere and store credentials/secrets outside of source code.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">7. Your rights</h2>
              <p className="mt-2">
                If you&apos;re in New Zealand, the Privacy Act 2020 gives you the right to access
                and request correction of personal information we hold about you. You can also ask
                us to delete your account and associated data at any time. To do so, contact us
                using the details below.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">8. Children&apos;s privacy</h2>
              <p className="mt-2">
                KiwiCart is not directed at children, and we don&apos;t knowingly collect
                information from anyone under 13. If you believe a child has created an account,
                please contact us so we can remove it.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">9. Changes to this policy</h2>
              <p className="mt-2">
                We may update this policy as KiwiCart evolves. We&apos;ll update the &ldquo;Last
                updated&rdquo; date above when we do. Continued use of KiwiCart after a change means
                you accept the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">10. Contact</h2>
              <p className="mt-2">
                KiwiCart was a university student project and is no longer operated. This page is kept for reference only, and no contact address is monitored.
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
