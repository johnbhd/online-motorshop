import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRight,
  faAward,
  faBoxOpen,
  faCartShopping,
  faCheck,
  faCircleInfo,
  faCircleUser,
  faClock,
  faLocationDot,
  faMagnifyingGlass,
  faMotorcycle,
  faPhone,
  faShieldHalved,
  faStore,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";

export type HomeHighlight = {
  id: string;
  label: string;
  icon: IconDefinition;
};

export type HomeBadge = {
  id: string;
  title: string;
  detail?: string;
  icon: IconDefinition;
};

export type HomeBrand = {
  id: string;
  name: string;
  description: string;
  image: string;
  alt: string;
  href: string;
};

export type HomeCategory = {
  id: string;
  name: string;
  description: string;
  image: string;
  alt: string;
  href: string;
};

export type HomeProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  alt: string;
  href: string;
};

export type OrderingStep = {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: IconDefinition;
};

export type FulfillmentOption = {
  id: string;
  label: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  items: string[];
  icon: IconDefinition;
  actionLabel: string;
  href: string;
  tone: "pickup" | "delivery";
};

export type HomeInfoCard = {
  id: string;
  title: string;
  detail: string;
  icon: IconDefinition;
};

export const homeHighlights: HomeHighlight[] = [
  {
    id: "genuine-parts",
    label: "Genuine Parts",
    icon: faShieldHalved,
  },
  {
    id: "supported-brands",
    label: "Honda, Yamaha and Suzuki",
    icon: faMotorcycle,
  },
  {
    id: "store-pickup",
    label: "Store Pickup",
    icon: faStore,
  },
  {
    id: "lalamove-delivery",
    label: "Lalamove Delivery",
    icon: faTruck,
  },
];

export const homeBadges: HomeBadge[] = [
  {
    id: "trusted-service",
    title: "Trusted Parts. Reliable Service.",
    detail: "Serving riders for 4 years",
    icon: faAward,
  },
  {
    id: "flexible-fulfillment",
    title: "Pickup and Lalamove Delivery Available",
    icon: faTruck,
  },
];

export const homeBrands: HomeBrand[] = [
  {
    id: "honda",
    name: "Honda",
    description:
      "Browse genuine and compatible parts for Honda motorcycles, including engine, brake, electrical, and maintenance parts.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787814541/honda.png",
    alt: "ALD Motorshop motorcycle parts display for Honda customers",
    href: "/#home-products",
  },
  {
    id: "yamaha",
    name: "Yamaha",
    description:
      "Explore parts and maintenance products for Yamaha motorcycles, from performance components to electrical parts.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787814544/yamaha.png",
    alt: "ALD Motorshop storefront for Yamaha customers",
    href: "/#home-products",
  },
  {
    id: "suzuki",
    name: "Suzuki",
    description:
      "Find compatible parts for Suzuki models, including brakes, engine components, filters, and accessories.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787814544/suzuki.png",
    alt: "ALD Motorshop branch for Suzuki customers",
    href: "/#home-products",
  },
];

export const homeCategories: HomeCategory[] = [
  {
    id: "engine-parts",
    name: "Engine Parts",
    description: "Pistons, cylinders, gaskets, and engine components.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561337/Honda-Filter-Set.png",
    alt: "Honda engine filter set",
    href: "/#home-products",
  },
  {
    id: "brake-parts",
    name: "Brake Parts",
    description: "Brake pads, discs, cables, and related components.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561477/Honda-Brake-Pad.png",
    alt: "Honda motorcycle brake pad",
    href: "/#home-products",
  },
  {
    id: "electrical-parts",
    name: "Electrical Parts",
    description: "Lighting, spark plugs, wiring, and electrical parts.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787560931/Honda-Spark-Plug.png",
    alt: "Honda motorcycle spark plug",
    href: "/#home-products",
  },
  {
    id: "suspension-parts",
    name: "Suspension Parts",
    description: "Shock absorbers and parts for a controlled, comfortable ride.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787560947/Honda-Shock-Absorber.png",
    alt: "Honda motorcycle shock absorber",
    href: "/#home-products",
  },
  {
    id: "transmission-parts",
    name: "Transmission Parts",
    description: "Drive-chain and transmission components for daily riding.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561477/Honda-Chain-Kit.png",
    alt: "Honda motorcycle chain kit",
    href: "/#home-products",
  },
  {
    id: "body-exterior",
    name: "Body & Exterior",
    description: "Covers, fairings, panels, and exterior replacement parts.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561351/Honda-Front-Cover-Pipe.png",
    alt: "Honda motorcycle front cover pipe",
    href: "/#home-products",
  },
  {
    id: "tires-wheels",
    name: "Tires & Wheels",
    description: "Road-ready tires, wheels, and related replacement parts.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787560944/Honda-Front-Tire.png",
    alt: "Honda motorcycle front tire",
    href: "/#home-products",
  },
  {
    id: "accessories-maintenance",
    name: "Accessories & Maintenance",
    description: "Practical accessories and products for routine maintenance.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561449/Honda-Oil-Filter.png",
    alt: "Honda motorcycle oil filter",
    href: "/#home-products",
  },
];

export const featuredProducts: HomeProduct[] = [
  {
    id: "honda-air-filter",
    name: "Honda Air Filter",
    brand: "Honda",
    category: "Engine Parts",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561452/Honda-Air-Filter.png",
    alt: "Motorcycle parts display for Honda air filter customers",
    href: "/#home-products",
  },
  {
    id: "honda-battery",
    name: "Honda Motorcycle Battery",
    brand: "Honda",
    category: "Electrical Parts",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561463/Honda-Battery.png",
    alt: "Motorcycle parts display for Honda battery customers",
    href: "/#home-products",
  },
  {
    id: "honda-shock-absorber",
    name: "Honda Shock Absorber",
    brand: "Honda",
    category: "Suspension Parts",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787560947/Honda-Shock-Absorber.png",
    alt: "Motorcycle parts display for Honda suspension customers",
    href: "/#home-products",
  },
  {
    id: "suzuki-brake-shoe",
    name: "Suzuki Brake Shoe",
    brand: "Suzuki",
    category: "Brake Parts",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561079/Suzuki-Brake-Shoe.png",
    alt: "Motorcycle parts display for Suzuki brake customers",
    href: "/#home-products",
  },
  {
    id: "suzuki-tire",
    name: "Suzuki Tire",
    brand: "Suzuki",
    category: "Tires & Wheels",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561038/Suzuki-Tire.png",
    alt: "Motorcycle parts display for Suzuki tire customers",
    href: "/#home-products",
  },
  {
    id: "suzuki-drive-chain-kit",
    name: "Suzuki Drive Chain Kit",
    brand: "Suzuki",
    category: "Transmission Parts",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561052/Suzuki-Chain-Kit.png",
    alt: "Motorcycle parts display for Suzuki transmission customers",
    href: "/#home-products",
  },
  {
    id: "yamaha-brake-pad-kit",
    name: "Yamaha Brake Pad Kit",
    brand: "Yamaha",
    category: "Brake Parts",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561155/Yamaha-Brake-Pad.png",
    alt: "Motorcycle parts display for Yamaha brake customers",
    href: "/#home-products",
  },
  {
    id: "yamaha-spark-plug",
    name: "Yamaha Spark Plug",
    brand: "Yamaha",
    category: "Electrical Parts",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561151/Yamaha-Spark-Plug.png",
    alt: "Motorcycle parts display for Yamaha electrical customers",
    href: "/#home-products",
  },
  {
    id: "yamaha-v-belt",
    name: "Yamaha V-Belt",
    brand: "Yamaha",
    category: "Transmission Parts",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561168/Yamaha-V-Belt.png",
    alt: "Motorcycle parts display for Yamaha transmission customers",
    href: "/#home-products",
  },
];

export const orderingSteps: OrderingStep[] = [
  {
    id: "browse-products",
    number: 1,
    title: "Browse Products",
    description:
      "Search motorcycle parts by product name, category, brand, or compatible model.",
    icon: faMagnifyingGlass,
  },
  {
    id: "add-items",
    number: 2,
    title: "Add Items to Cart",
    description:
      "Choose the products and quantities you need, then review your request.",
    icon: faCartShopping,
  },
  {
    id: "submit-request",
    number: 3,
    title: "Submit Order Request",
    description:
      "Enter your contact details and choose store pickup or Lalamove delivery.",
    icon: faBoxOpen,
  },
  {
    id: "staff-confirmation",
    number: 4,
    title: "Receive Staff Confirmation",
    description:
      "ALD staff verifies availability, final price, payment, and fulfillment details.",
    icon: faCheck,
  },
];

export const fulfillmentOptions: FulfillmentOption[] = [
  {
    id: "store-pickup",
    label: "Store Pickup",
    title: "Pick Up at an ALD Branch",
    description:
      "Choose your preferred branch during checkout. ALD staff will notify you once your confirmed order is ready for collection.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787814770/imus.png",
    alt: "ALD Motorshop branch storefront for store pickup",
    items: [
      "Select your preferred pickup branch",
      "Receive a ready-for-pickup update",
      "Present your order reference at the branch",
    ],
    icon: faStore,
    actionLabel: "View Pickup Branches",
    href: "/about",
    tone: "pickup",
  },
  {
    id: "lalamove-delivery",
    label: "Lalamove Delivery",
    title: "Request Lalamove Delivery",
    description:
      "ALD staff arranges the booking after confirming your order, payment, address, and delivery fee.",
    image: "https://res.cloudinary.com/ykkjo51n/image/upload/v1787820813/lalamove.png",
    alt: "Motorcycle parts prepared for a delivery request",
    items: [
      "Delivery request recorded with your order",
      "Booking details provided after confirmation",
      "Delivery status available through order tracking",
    ],
    icon: faTruck,
    actionLabel: "Learn About Delivery",
    href: "/about",
    tone: "delivery",
  },
];

export const homeInfoCards: HomeInfoCard[] = [
  {
    id: "guest-ordering",
    title: "Guest Ordering Available",
    detail: "No customer account is required.",
    icon: faCircleUser,
  },
  {
    id: "supported-brands-info",
    title: "Honda, Yamaha, and Suzuki Parts",
    detail: "Compatible parts for common motorcycle brands.",
    icon: faMotorcycle,
  },
  {
    id: "branch-support",
    title: "Branch Support",
    detail: "Visit ALD Motorshop for help with parts and service.",
    icon: faLocationDot,
  },
];

export const homeUtilityIcons = {
  arrow: faArrowRight,
  cart: faCartShopping,
  check: faCheck,
  info: faCircleInfo,
  phone: faPhone,
  clock: faClock,
};
