import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#5a1f1a] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gold-600/30">
        <Link to="/" className="text-gold-400 text-2xl font-bold">Lipa<span className="text-white">Clip</span></Link>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gold-400">Terms and Conditions</h1>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using LipaClip, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">2. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">3. User Conduct</h2>
            <p>You agree not to engage in any conduct that restricts or inhibits anyone's use or enjoyment of the platform. This includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Harassing or causing distress or inconvenience to any person</li>
              <li>Transmitting obscene or offensive content</li>
              <li>Disrupting the normal flow of dialogue within our platform</li>
              <li>Posting spam or misleading content</li>
              <li>Violating intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">4. Campaign Guidelines</h2>
            <p>Brands must ensure all campaigns comply with local laws and regulations. Content must not be defamatory, offensive, or infringe on third-party rights. LipaClip reserves the right to reject or remove any campaign at our sole discretion.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">5. Payments and Fees</h2>
            <p>All prices are in Ugandan Shillings (UGX). A 5% deposit fee applies to all brand deposits. Influencers pay a 15% service fee on withdrawals. Payments are non-refundable unless explicitly stated otherwise.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">6. Limitation of Liability</h2>
            <p>LipaClip is provided on an "as is" basis. We do not warrant that the service will be uninterrupted or error-free. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">7. Termination</h2>
            <p>We reserve the right to terminate your account at any time for violation of these terms or any illegal activity. Upon termination, your right to use the service immediately ceases.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Your continued use of the platform following the posting of revised terms means that you accept and agree to the changes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold-400 mb-3">9. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at support@lipaclip.site</p>
          </section>
        </div>

        <Link to="/" className="inline-block mt-8 text-gold-400 hover:text-gold-300">← Back to Home</Link>
      </div>
    </div>
  )
}