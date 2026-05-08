import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#5a1f1a] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gold-600/30">
        <Link to="/" className="text-gold-400 text-2xl font-bold">Lipa<span className="text-white">Clip</span></Link>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gold-400">Privacy Policy</h1>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly, such as:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Account information (name, email, phone)</li>
              <li>Payment information (processed securely via Pesapal)</li>
              <li>Social media profiles and verification data</li>
              <li>Campaign and submission details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Process payments and withdrawals</li>
              <li>Verify influencer authenticity</li>
              <li>Track campaign performance and views</li>
              <li>Send service updates and notifications</li>
              <li>Improve our platform and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your information.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">4. Third-Party Services</h2>
            <p>We use third-party services including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Supabase</strong> — Database and authentication</li>
              <li><strong>Pesapal</strong> — Payment processing</li>
              <li><strong>RapidAPI / TikTok API</strong> — Social media verification</li>
            </ul>
            <p className="mt-2">These services have their own privacy policies. We recommend reviewing them.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">6. Data Retention</h2>
            <p>We retain your information for as long as your account is active or as needed to provide services. You can request deletion at any time, subject to legal retention requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">7. Changes to Privacy Policy</h2>
            <p>We may update this policy periodically. We will notify you of any material changes via email or through the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">8. Contact Us</h2>
            <p>If you have privacy concerns, contact us at privacy@lipaclip.site</p>
          </section>
        </div>

        <Link to="/" className="inline-block mt-8 text-gold-400 hover:text-gold-300">← Back to Home</Link>
      </div>
    </div>
  )
}