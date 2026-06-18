import { Mail } from "lucide-react";

const MaintenancePage = () => (
  <div className="min-h-screen bg-[#F9F5F0] flex flex-col items-center justify-center px-6 text-center">
    <img
      src="/mcculloch-logo.png"
      alt="McCulloch Jewelry"
      className="h-16 w-auto mb-12 opacity-90"
    />

    <div className="flex items-center gap-4 mb-10">
      <div className="h-px w-16 bg-[#C9A96E]" />
      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
      <div className="h-px w-16 bg-[#C9A96E]" />
    </div>

    <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-light text-[#1a1a1a] tracking-wide mb-5">
      We'll Be Back Soon
    </h1>

    <p className="font-['Futura_PT'] text-[12px] tracking-[0.18em] uppercase text-[#7a6a5a] mb-4 max-w-md">
      We're currently making improvements to our website
    </p>
    <p className="font-['Cormorant_Garamond'] text-lg text-[#5a4a3a] mb-12 max-w-sm leading-relaxed">
      Our team is refining your shopping experience. We'll be back shortly — thank you for your patience.
    </p>

    <div className="flex items-center gap-4 mb-10">
      <div className="h-px w-16 bg-[#C9A96E]" />
      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
      <div className="h-px w-16 bg-[#C9A96E]" />
    </div>

    <p className="font-['Futura_PT'] text-[10px] tracking-[0.2em] uppercase text-[#9a8a7a] mb-3">
      For urgent enquiries
    </p>
    <a
      href="mailto:info@mcculloch.co.uk"
      className="inline-flex items-center gap-2 text-[#C9A96E] hover:text-[#a88550] transition-colors font-['Cormorant_Garamond'] text-lg"
    >
      <Mail className="w-4 h-4" />
      info@mcculloch.co.uk
    </a>

    <p className="mt-16 text-[10px] tracking-[0.2em] uppercase text-[#c0b0a0] font-['Futura_PT']">
      © McCulloch Jewelry
    </p>
  </div>
);

export default MaintenancePage;
