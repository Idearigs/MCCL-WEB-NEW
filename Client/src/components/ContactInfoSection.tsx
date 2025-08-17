import { MapPin, Phone, Mail, Clock } from "lucide-react";

const ContactInfoSection = () => {
  const contactInfo = [
    { 
      icon: <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />, 
      text: "No. 1, Galle Face Terrace, Colombo 03, Sri Lanka" 
    },
    { 
      icon: <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />, 
      text: "+94 11 2 555 555" 
    },
    { 
      icon: <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />, 
      text: "info@mcculloch.lk" 
    },
    { 
      icon: <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />, 
      text: "Mon - Sat: 10:00 AM - 7:00 PM" 
    },
  ];

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-[#8b7d65] tracking-wider mb-2">McCulloch The Jewellers</h2>
        <p className="text-sm text-gray-600">Creators of Exceptional Jewelry Since 1847</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {contactInfo.slice(0, 2).map((item, index) => (
            <div key={index} className="flex items-start gap-4">
              {item.icon}
              <span className="text-sm text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {contactInfo.slice(2).map((item, index) => (
            <div key={index} className="flex items-start gap-4">
              {item.icon}
              <span className="text-sm text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactInfoSection;
