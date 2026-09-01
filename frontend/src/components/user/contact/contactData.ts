import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRight,
  faClipboardList,
  faClock,
  faCreditCard,
  faMessage,
  faMotorcycle,
  faPhone,
  faScrewdriverWrench,
  faStar,
  faStore,
  faTag,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF,
  faFacebookMessenger,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";

export type ContactInfoItem = {
  id: string;
  label: string;
  value: string;
  ctaLabel: string;
  ctaHref?: string;
  icon: IconDefinition;
};

export type ContactNeed = {
  id: string;
  label: string;
  icon: IconDefinition;
};

export type ContactBranch = {
  id: string;
  name: string;
  image: string;
  address: string;
  services: string[];
};

export type ContactSocial = {
  id: string;
  label: string;
  account: string;
  icon: IconDefinition;
};

export const contactInfoItems: ContactInfoItem[] = [
  {
    id: "phone",
    label: "Mobile Number",
    value: "+63 995 869 1174",
    ctaLabel: "Call ALD",
    ctaHref: "tel:+639958691174",
    icon: faPhone,
  },
  {
    id: "messenger",
    label: "Facebook and Messenger",
    value: "ALD Motorshop - Main",
    ctaLabel: "Open Messenger",
    icon: faFacebookMessenger,
  },
  {
    id: "instagram",
    label: "Instagram",
    value: "@aldmotorshop",
    ctaLabel: "View Instagram",
    icon: faInstagram,
  },
  {
    id: "hours",
    label: "Operating Hours",
    value: "Contact branch for current hours",
    ctaLabel: "Ask for Branch Hours",
    ctaHref: "#contact-branches",
    icon: faClock,
  },
];

export const contactNeeds: ContactNeed[] = [
  {
    id: "availability",
    label: "Product Availability",
    icon: faStore,
  },
  {
    id: "price",
    label: "Product Price",
    icon: faTag,
  },
  {
    id: "compatibility",
    label: "Motorcycle Part Compatibility",
    icon: faMotorcycle,
  },
  {
    id: "order",
    label: "Existing Order",
    icon: faClipboardList,
  },
  {
    id: "payment",
    label: "Payment Concern",
    icon: faCreditCard,
  },
  {
    id: "delivery",
    label: "Lalamove Delivery",
    icon: faTruck,
  },
  {
    id: "promo",
    label: "Store Promo",
    icon: faStar,
  },
  {
    id: "service",
    label: "Maintenance or Repair Service",
    icon: faScrewdriverWrench,
  },
];

export const contactBranches: ContactBranch[] = [
  {
    id: "manila",
    name: "Manila Branch",
    image: "/branches/manila.png",
    address: "3333 New Panaderos, Sta. Ana, Manila, 1016 Metro Manila",
    services: ["Motorcycle parts", "Maintenance and repair", "Store pickup"],
  },
  {
    id: "makati",
    name: "Makati Branch",
    image: "/branches/makati.png",
    address: "3678 Bautista Street, Makati City",
    services: ["Motorcycle parts", "Maintenance and repair", "Store pickup"],
  },
  {
    id: "imus",
    name: "Imus Branch",
    image: "/branches/imus.png",
    address: "LYS Building, General Aguinaldo Highway, Imus, 4103 Cavite",
    services: ["Motorcycle parts", "Maintenance and repair", "Store pickup"],
  },
];

export const contactSocials: ContactSocial[] = [
  {
    id: "facebook",
    label: "Facebook",
    account: "ALD Motorshop - Main",
    icon: faFacebookF,
  },
  {
    id: "instagram",
    label: "Instagram",
    account: "@aldmotorshop",
    icon: faInstagram,
  },
];

export const contactHeroIcon = faMessage;
export const contactArrowIcon = faArrowRight;
