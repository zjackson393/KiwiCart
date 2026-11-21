import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KiwiCart | Terms of Service",
  description: "The terms that govern your use of KiwiCart.",
};

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-kcCreamLight text-kcGreenDark">

      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl rounded-2xl border border-kcCreamMedium bg-white/80 p-8 shadow-[0_12px_40px_rgba(32,58,20,0.08)] sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-kcGreenDark-70">Last updated: 17 July 2026</p>

          <div className="mt-8 space-y-8 text-sm leading-6 sm:text-base sm:leading-7">
            <section>
              <h2 className="text-lg font-semibold">1. Acceptance of terms</h2>
              <p className="mt-2">
                By accessing or using kiwicart.app (&ldquo;KiwiCart&rdquo;, &ldquo;the
                Service&rdquo;), you agree to these Terms of Service and to our{" "}
                <a className="underline" href="/privacy">
                  Privacy Policy
                </a>
                . If you don&apos;t agree, please don&apos;t use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">2. What KiwiCart does</h2>
              <p className="mt-2">
                KiwiCart lets you compare grocery prices across participating New Zealand
                supermarkets and generates suggested shopping routes (cheapest, quickest, or a
                hybrid of the two) based on that data. It is an independent project and is not
                affiliated with, endorsed by, or operated on behalf of any supermarket chain or
                retailer named or shown in the app.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">3. Eligibility</h2>
              <p className="mt-2">
                You must be at least 13 years old to use KiwiCart. By using the Service, you
                confirm that you meet this requirement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">4. Accounts</h2>
              <p className="mt-2">
                KiwiCart uses Google Sign-In to authenticate you, there are no
                separate KiwiCart passwords. You&apos;re responsible for keeping your Google account
                secure; we can&apos;t recover access to KiwiCart for you if your Google account is
                compromised. We may suspend or disable an account that we reasonably believe is
                being used in breach of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">5. Acceptable use</h2>
              <p className="mt-2">You agree not to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Scrape, reverse-engineer, or excessively query the Service in a way that degrades it for other users.</li>
                <li>Use the Service for any unlawful purpose, or to infringe anyone else&apos;s rights.</li>
                <li>Attempt to gain unauthorised access to KiwiCart&apos;s systems or other users&apos; accounts.</li>
                <li>Misrepresent your identity or impersonate another person or entity.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">6. Pricing &amp; data accuracy</h2>
              <p className="mt-2">
                Prices, stock, and store information displayed in KiwiCart are sourced from
                third-party data (grocer.nz) and may be delayed, incomplete, or inaccurate compared
                to what you&apos;re actually charged in-store or online. Always verify the final
                price at checkout. KiwiCart is a planning tool, not a price guarantee, and we are not
                responsible for discrepancies between prices shown in the app and prices charged by
                a retailer.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">7. Routes &amp; navigation</h2>
              <p className="mt-2">
                Suggested shopping routes are generated using third-party mapping and routing data
                (OpenStreetMap/OSRM) and are provided for planning purposes only. They are not a
                substitute for real-time navigation, traffic information, or your own judgement.
                Always follow road rules and drive safely; KiwiCart is not liable for any loss or
                harm arising from following a suggested route.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">8. Intellectual property</h2>
              <p className="mt-2">
                The KiwiCart name, logo, and app design are the property of KiwiCart. Product names,
                logos, and images belong to their respective retailers and are used only to identify
                products and stores for comparison purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">9. Disclaimer of warranties</h2>
              <p className="mt-2">
                KiwiCart is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
                warranties of any kind, whether express or implied, including (to the extent
                permitted by law) implied warranties of merchantability, fitness for a particular
                purpose, and non-infringement. We don&apos;t guarantee the Service will be
                uninterrupted, error-free, or available at all times.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">10. Limitation of liability</h2>
              <p className="mt-2">
                To the maximum extent permitted by law, KiwiCart and its operator will not be liable
                for any indirect, incidental, or consequential loss (including lost savings, time,
                or data) arising from your use of the Service. Nothing in these Terms limits any
                right you have under the Consumer Guarantees Act 1993 or the Fair Trading Act 1986
                that cannot lawfully be excluded.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">11. Termination</h2>
              <p className="mt-2">
                You may stop using KiwiCart and disconnect your Google account at any time. We may
                suspend or terminate access to the Service, in whole or in part, at our discretion
               , for example, to address a breach of these Terms or for maintenance.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">12. Changes to these terms</h2>
              <p className="mt-2">
                We may update these Terms from time to time. We&apos;ll update the &ldquo;Last
                updated&rdquo; date above when we do. Continuing to use KiwiCart after a change means
                you accept the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">13. Governing law</h2>
              <p className="mt-2">
                These Terms are governed by the laws of New Zealand, and any disputes will be subject
                to the exclusive jurisdiction of the courts of Wellington, New Zealand.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">14. Contact</h2>
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
