import { MapPin, Phone, Mail, Clock } from "lucide-react";

const ContactInfoSection = () => {
  const contactInfo = [
    {
      icon: <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />,
      text: "7 The Square, Beeston, Nottinghamshire, NG9 2JG"
    },
    {
      icon: <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />,
      text: "0115 925 7552"
    },
    {
      icon: <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />,
      text: "has@mccullochjewellers.co.uk"
    },
    {
      icon: <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />,
      text: "Mon–Sat: 9:00am–5:30pm | Sunday: Closed"
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
