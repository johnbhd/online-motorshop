import ContactBranches from "./ContactBranches";
import ContactForm from "./ContactForm";
import ContactHero from "./ContactHero";
import ContactInfo from "./ContactInfo";
import ContactSocials from "./ContactSocials";

export default function ContactPage() {
  return (
    <div className="contact-page">
      <ContactHero />
      <ContactInfo />
      <ContactForm />
      <ContactBranches />
      <ContactSocials />
    </div>
  );
}
