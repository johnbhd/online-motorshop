import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBuilding,
  faClock,
  faComment,
  faLocationDot,
  faMap,
  faMotorcycle,
  faPhone,
  faScrewdriverWrench,
  faStore,
  faTruck,
  faBoxOpen,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

export type AboutStat = { value: string; detail: string; icon: IconDefinition };
export type AboutBranch = {
  name: string;
  image: string;
  address: string;
  tags: string[];
};
export type AboutJourneyItem = {
  title: string;
  subtitle: string;
  description: string;
};
export type AboutOffer = {
  title: string;
  description: string;
  icon: IconDefinition;
};

export const aboutHighlights = [
  { label: "Genuine Motorcycle Parts", icon: faCheck },
  { label: "Trusted Local Service", icon: faCheck },
  { label: "Multiple Branches", icon: faCheck },
];

export const aboutStatistics: AboutStat[] = [
  { value: "4 Years", detail: "In Business", icon: faBuilding },
  { value: "3 Verified", detail: "Branches", icon: faStore },
  { value: "Honda, Yamaha", detail: "and Suzuki Parts", icon: faMotorcycle },
  { value: "Pickup and", detail: "Delivery Available", icon: faTruck },
];

export const aboutJourney: AboutJourneyItem[] = [
  {
    title: "The Beginning",
    subtitle: "Starting the Business",
    description:
      "ALD Motorshop began as a local motorcycle-parts shop focused on serving riders with dependable products and helpful assistance.",
  },
  {
    title: "Growing Trust",
    subtitle: "Building Customer Relationships",
    description:
      "The shop continued serving customers looking for parts, motorcycle maintenance, and repair assistance.",
  },
  {
    title: "Business Expansion",
    subtitle: "Opening More Branches",
    description:
      "ALD Motorshop expanded from one shop into multiple branches to make products and services more accessible.",
  },
  {
    title: "Today",
    subtitle: "Four Years of Service",
    description:
      "After four years of operation, ALD continues improving how customers browse, request, pick up, and receive motorcycle parts.",
  },
];

export const aboutOffers: AboutOffer[] = [
  {
    title: "Genuine Motorcycle Parts",
    description:
      "Reliable and compatible motorcycle parts selected for different motorcycle models.",
    icon: faBoxOpen,
  },
  {
    title: "Honda, Yamaha and Suzuki Parts",
    description:
      "Parts and maintenance products for three widely used motorcycle brands.",
    icon: faMotorcycle,
  },
  {
    title: "Motorcycle Accessories",
    description:
      "Practical accessories for motorcycle safety, comfort, maintenance, and appearance.",
    icon: faScrewdriverWrench,
  },
  {
    title: "Maintenance and Repair Services",
    description:
      "Motorcycle maintenance and repair assistance provided by experienced ALD personnel.",
    icon: faScrewdriverWrench,
  },
  {
    title: "Store Pickup",
    description:
      "Customers can request products online and collect confirmed orders from their selected ALD branch.",
    icon: faStore,
  },
  {
    title: "Lalamove Delivery Requests",
    description:
      "Customers can request delivery after the order, payment, address, and delivery fee have been confirmed.",
    icon: faTruck,
  },
];

export const aboutBranches: AboutBranch[] = [
  {
    name: "Manila Branch",
    image: "/branches/manila.png",
    address: "3333 New Panaderos, Santa Ana, Manila, 1016 Metro Manila",
    tags: ["Motorcycle Parts", "Maintenance and Repair", "Store Pickup"],
  },
  {
    name: "Makati Branch",
    image: "/branches/makati.png",
    address: "3678 Bautista Street, Makati City",
    tags: ["Motorcycle Parts", "Maintenance and Repair", "Store Pickup"],
  },
  {
    name: "Imus Branch",
    image: "/branches/imus.png",
    address: "LYS Building, General Aguinaldo Highway, Imus, 4103 Cavite",
    tags: ["Motorcycle Parts", "Maintenance and Repair", "Store Pickup"],
  },
];

export const branchInfoIcons = {
  address: faLocationDot,
  hours: faClock,
  contact: faComment,
  map: faMap,
  pickup: faStore,
  phone: faPhone,
};
