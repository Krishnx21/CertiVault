import { useState, useMemo } from "react";
import { Topbar } from "../components/Topbar.js";
import { Sidebar } from "../components/Sidebar.js";
import { Accordion, AccordionItem } from "../components/Accordion.js";
import { 
  Search, BookOpen, Shield, UploadCloud, 
  CheckCircle, Users, Mail, ExternalLink, LifeBuoy 
} from "lucide-react";

export default function HelpCenter() {
  const [mobileNav, setMobileNav] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [summary] = useState({ total: 0, verified: 0, pending: 0, rejected: 0, archived: 0, favorites: 0, storageBytes: 0 });

  const faqs: AccordionItem[] = [
    {
      id: "faq-1",
      title: "How do I upload a certificate?",
      content: "Navigate to the Documents page and click the 'Upload' button in the top right corner. You can drag and drop your certificate file (PDF, PNG, JPG) or click to browse your computer. Once selected, fill in the metadata and click Upload."
    },
    {
      id: "faq-2",
      title: "How do I verify a certificate?",
      content: "Go to the Verifications page and click 'Verify Document'. Enter the document ID or upload the file you wish to verify. Our system will check the cryptographic signature against the blockchain record to ensure authenticity."
    },
    {
      id: "faq-3",
      title: "What file formats are supported?",
      content: "Currently, we support PDF, PNG, and JPG formats for certificate uploads. The maximum file size is 5MB."
    },
    {
      id: "faq-4",
      title: "Can I delete a certificate?",
      content: "Yes, if you are the owner of the document, you can delete it. Go to the Documents page, click the three dots (kebab menu) next to the document, and select 'Delete'. Note that this action is irreversible."
    },
    {
      id: "faq-5",
      title: "How secure is my data?",
      content: "Your data is highly secure. We use AES-256 encryption for all documents at rest and TLS 1.3 for data in transit. Additionally, all certificates are hashed and anchored to the blockchain for tamper-evident verification."
    },
    {
      id: "faq-6",
      title: "Where are files stored?",
      content: "Files are stored in secure, geo-redundant cloud storage. Access is strictly controlled through robust authentication and authorization policies."
    }
  ];

  const troubleshooting: AccordionItem[] = [
    {
      id: "ts-1",
      title: "Upload fails with 'File too large' error",
      content: "Ensure your file is under the 5MB limit. If your file is a high-resolution PDF, try compressing it before uploading."
    },
    {
      id: "ts-2",
      title: "Verification fails but the document is legitimate",
      content: "Ensure you are uploading the exact, unmodified file that was originally issued. Even opening a PDF in some editors and saving it without changes can alter the file hash, causing verification to fail."
    },
    {
      id: "ts-3",
      title: "I can't see a document that was shared with me",
      content: "Check your 'Shared Vaults' page. If it's still missing, ask the document owner to verify they shared it with the correct email address."
    }
  ];

  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return faqs;
    const lowerQuery = searchQuery.toLowerCase();
    return faqs.filter(
      q => q.title.toLowerCase().includes(lowerQuery) || 
           (typeof q.content === 'string' && q.content.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery, faqs]);

  const filteredTroubleshooting = useMemo(() => {
    if (!searchQuery) return troubleshooting;
    const lowerQuery = searchQuery.toLowerCase();
    return troubleshooting.filter(
      q => q.title.toLowerCase().includes(lowerQuery) || 
           (typeof q.content === 'string' && q.content.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery, troubleshooting]);

  return (
    <div className="app-shell">
      <Sidebar mobileNav={mobileNav} summary={summary} />
      {mobileNav && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}
      
      <main>
        <Topbar setMobileNav={setMobileNav} />
        
        <div className="content">
          <div className="max-w-5xl mx-auto" style={{ paddingBottom: '100px' }}>
          
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full" style={{ background: "var(--bg-tertiary)", color: "var(--accent-blue)" }}>
              <LifeBuoy size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Find answers, troubleshoot issues, and learn how to get the most out of CertiVault.
            </p>
            
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} size={20} />
              <input
                type="text"
                placeholder="Search for answers..."
                className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-shadow"
                style={{ 
                  backgroundColor: "var(--bg-secondary)", 
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)"
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {!searchQuery && (
            <>
              {/* Getting Started Section */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <BookOpen size={24} style={{ color: "var(--accent-blue)" }} />
                  Getting Started
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-xl border transition-colors hover:border-[var(--accent-blue)]" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
                    <UploadCloud size={28} className="mb-4" style={{ color: "var(--accent-green)" }} />
                    <h3 className="text-lg font-semibold mb-2">Upload Certificates</h3>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Easily upload and manage your digital certificates in a secure vault.
                    </p>
                  </div>
                  <div className="p-6 rounded-xl border transition-colors hover:border-[var(--accent-blue)]" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
                    <CheckCircle size={28} className="mb-4" style={{ color: "var(--accent-cyan)" }} />
                    <h3 className="text-lg font-semibold mb-2">Verify Authenticity</h3>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Instantly verify documents against cryptographic signatures.
                    </p>
                  </div>
                  <div className="p-6 rounded-xl border transition-colors hover:border-[var(--accent-blue)]" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
                    <Users size={28} className="mb-4" style={{ color: "var(--accent-amber)" }} />
                    <h3 className="text-lg font-semibold mb-2">Share & Collaborate</h3>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Share access to your vault securely with team members and verifiers.
                    </p>
                  </div>
                </div>
              </section>

              {/* Security & Privacy */}
              <section className="mb-12">
                <div className="p-8 rounded-2xl relative overflow-hidden" style={{ background: "var(--gradient-primary)", color: "#fff" }}>
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <Shield size={64} className="flex-shrink-0 opacity-90" />
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Security & Privacy First</h2>
                      <p className="text-white/80 max-w-2xl">
                        CertiVault employs AES-256 encryption for data at rest and TLS 1.3 for data in transit. 
                        We strictly adhere to zero-knowledge principles where possible, ensuring your sensitive 
                        documents remain entirely private and accessible only to those you authorize.
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                </div>
              </section>
            </>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* FAQs */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
              {filteredFaqs.length > 0 ? (
                <Accordion items={filteredFaqs} />
              ) : (
                <p style={{ color: "var(--text-muted)" }}>No FAQs match your search.</p>
              )}
            </section>

            {/* Troubleshooting & Support */}
            <section className="flex flex-col gap-12">
              <div>
                <h2 className="text-2xl font-bold mb-6">Troubleshooting</h2>
                {filteredTroubleshooting.length > 0 ? (
                  <Accordion items={filteredTroubleshooting} />
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>No troubleshooting guides match your search.</p>
                )}
              </div>

              {!searchQuery && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Need more help?</h2>
                  <div className="p-6 rounded-xl border flex flex-col gap-4" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                        <Mail size={20} style={{ color: "var(--text-primary)" }} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Contact Support</h3>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Create a GitHub Issue in our repository.</p>
                      </div>
                    </div>
                    <a 
                      href="https://github.com/certivault/certivault/issues" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors"
                      style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                    >
                      Open an Issue <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              )}
            </section>
          </div>
          
          </div>
        </div>
      </main>
    </div>
  );
}
