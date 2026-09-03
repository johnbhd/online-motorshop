export const productBrands = ["Honda", "Yamaha", "Suzuki"] as const;

export type ProductBrand = (typeof productBrands)[number];

export const productCategories = [
  "Engine Parts",
  "Brake Parts",
  "Electrical Parts",
  "Suspension Parts",
  "Transmission Parts",
  "Body & Exterior",
  "Tires & Wheels",
  "Accessories & Maintenance",
] as const;

export type ProductCategory = (typeof productCategories)[number];

export const productAvailability = ["Listed"] as const;

export type ProductAvailability = (typeof productAvailability)[number];

export type ProductDisplayItem = {
  id: string;
  partNumber: string;
  name: string;
  brand: ProductBrand;
  category: ProductCategory;
  description: string;
  price: number;
  image: string;
  alt: string;
  availabilityStatus: "active";
  status: "active";
};

export type ProductFilterState = {
  brands: ProductBrand[];
  categories: ProductCategory[];
  availability: ProductAvailability[];
  minPrice: number;
  maxPrice: number;
};

export const productCatalog: ProductDisplayItem[] = [
  {
    id: "HON-001",
    partNumber: "HON-001",
    name: "Honda Genuine Spark Plug",
    brand: "Honda",
    category: "Electrical Parts",
    description: "Honda motorcycle spark plug.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787560931/Honda-Spark-Plug.png",
    alt: "Honda motorcycle spark plug",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-002",
    partNumber: "HON-002",
    name: "Honda Air Filter",
    brand: "Honda",
    category: "Accessories & Maintenance",
    description: "Honda motorcycle air filter.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561452/Honda-Air-Filter.png",
    alt: "Honda motorcycle air filter",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-003",
    partNumber: "HON-003",
    name: "Honda Front Brake Pad Set",
    brand: "Honda",
    category: "Brake Parts",
    description: "Honda motorcycle front brake pad set.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561477/Honda-Brake-Pad.png",
    alt: "Honda motorcycle front brake pad set",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-004",
    partNumber: "HON-004",
    name: "Honda Oil Filter",
    brand: "Honda",
    category: "Accessories & Maintenance",
    description: "Honda motorcycle oil filter.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561449/Honda-Oil-Filter.png",
    alt: "Honda motorcycle oil filter",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-005",
    partNumber: "HON-005",
    name: "Honda Drive Chain Kit",
    brand: "Honda",
    category: "Transmission Parts",
    description: "Honda motorcycle drive chain kit.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561477/Honda-Chain-Kit.png",
    alt: "Honda motorcycle drive chain kit",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-006",
    partNumber: "HON-006",
    name: "Honda Drive Belt",
    brand: "Honda",
    category: "Transmission Parts",
    description: "Honda motorcycle drive belt.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787560941/Honda-Drive-Belt.png",
    alt: "Honda motorcycle drive belt",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-007",
    partNumber: "HON-007",
    name: "Honda Motorcycle Battery",
    brand: "Honda",
    category: "Electrical Parts",
    description: "Honda motorcycle battery.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561463/Honda-Battery.png",
    alt: "Honda motorcycle battery",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-008",
    partNumber: "HON-008",
    name: "Honda Front Tire",
    brand: "Honda",
    category: "Tires & Wheels",
    description: "Honda motorcycle front tire.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787560944/Honda-Front-Tire.png",
    alt: "Honda motorcycle front tire",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-009",
    partNumber: "HON-009",
    name: "Honda Clutch Weight Set",
    brand: "Honda",
    category: "Transmission Parts",
    description: "Honda motorcycle clutch weight set.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787560934/Honda-Clutch-Weight.png",
    alt: "Honda motorcycle clutch weight set",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-010",
    partNumber: "HON-010",
    name: "Honda Shock Absorber",
    brand: "Honda",
    category: "Suspension Parts",
    description: "Honda motorcycle shock absorber.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787560947/Honda-Shock-Absorber.png",
    alt: "Honda motorcycle shock absorber",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-011",
    partNumber: "HON-011",
    name: "Honda Filter Set",
    brand: "Honda",
    category: "Engine Parts",
    description: "Honda motorcycle filter set.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561337/Honda-Filter-Set.png",
    alt: "Honda motorcycle filter set",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "HON-012",
    partNumber: "HON-012",
    name: "Honda Front Cover Pipe (Chrome)",
    brand: "Honda",
    category: "Body & Exterior",
    description: "Honda motorcycle front cover pipe.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561351/Honda-Front-Cover-Pipe.png",
    alt: "Honda motorcycle front cover pipe",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "SUZ-001",
    partNumber: "SUZ-001",
    name: "Suzuki Genuine Oil Filter",
    brand: "Suzuki",
    category: "Accessories & Maintenance",
    description: "Suzuki motorcycle oil filter.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561055/Suzuki-Oil-Filter.png",
    alt: "Suzuki motorcycle oil filter",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "SUZ-002",
    partNumber: "SUZ-002",
    name: "Suzuki Genuine Spark Plug",
    brand: "Suzuki",
    category: "Electrical Parts",
    description: "Suzuki motorcycle spark plug.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561055/Suzuki-Spark-Plug.png",
    alt: "Suzuki motorcycle spark plug",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "SUZ-003",
    partNumber: "SUZ-003",
    name: "Suzuki Air Filter / Air Cleaner",
    brand: "Suzuki",
    category: "Accessories & Maintenance",
    description: "Suzuki motorcycle air filter and air cleaner.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561036/Suzuki-Air-Filter.png",
    alt: "Suzuki motorcycle air filter and air cleaner",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "SUZ-004",
    partNumber: "SUZ-004",
    name: "Suzuki Brake Pad",
    brand: "Suzuki",
    category: "Brake Parts",
    description: "Suzuki motorcycle brake pad.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561053/Suzuki-Brake-Pad.png",
    alt: "Suzuki motorcycle brake pad",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "SUZ-005",
    partNumber: "SUZ-005",
    name: "Suzuki Brake Shoe",
    brand: "Suzuki",
    category: "Brake Parts",
    description: "Suzuki motorcycle brake shoe.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561079/Suzuki-Brake-Shoe.png",
    alt: "Suzuki motorcycle brake shoe",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "SUZ-006",
    partNumber: "SUZ-006",
    name: "Suzuki Drive Chain Kit",
    brand: "Suzuki",
    category: "Transmission Parts",
    description: "Suzuki motorcycle drive chain kit.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561052/Suzuki-Chain-Kit.png",
    alt: "Suzuki motorcycle drive chain kit",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "SUZ-007",
    partNumber: "SUZ-007",
    name: "Suzuki Sprocket",
    brand: "Suzuki",
    category: "Transmission Parts",
    description: "Suzuki motorcycle sprocket.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561050/Suzuki-Sprocket.png",
    alt: "Suzuki motorcycle sprocket",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "SUZ-008",
    partNumber: "SUZ-008",
    name: "Suzuki Battery",
    brand: "Suzuki",
    category: "Electrical Parts",
    description: "Suzuki motorcycle battery.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561037/Suzuki-Battery.webp",
    alt: "Suzuki motorcycle battery",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "SUZ-009",
    partNumber: "SUZ-009",
    name: "Suzuki Tire",
    brand: "Suzuki",
    category: "Tires & Wheels",
    description: "Suzuki motorcycle tire.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561038/Suzuki-Tire.png",
    alt: "Suzuki motorcycle tire",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "SUZ-010",
    partNumber: "SUZ-010",
    name: "ECSTAR Genuine Engine Oil",
    brand: "Suzuki",
    category: "Accessories & Maintenance",
    description: "ECSTAR genuine motorcycle engine oil.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561038/ECSTAR-Engine-Oil.png",
    alt: "ECSTAR genuine motorcycle engine oil",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-001",
    partNumber: "YAM-001",
    name: "Yamaha V-Belt",
    brand: "Yamaha",
    category: "Transmission Parts",
    description: "Yamaha motorcycle V-belt.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561168/Yamaha-V-Belt.png",
    alt: "Yamaha motorcycle V-belt",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-002",
    partNumber: "YAM-002",
    name: "Yamaha Brake Pad Kit",
    brand: "Yamaha",
    category: "Brake Parts",
    description: "Yamaha motorcycle brake pad kit.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561155/Yamaha-Brake-Pad.png",
    alt: "Yamaha motorcycle brake pad kit",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-003",
    partNumber: "YAM-003",
    name: "Yamaha Air Cleaner Element Assy",
    brand: "Yamaha",
    category: "Accessories & Maintenance",
    description: "Yamaha motorcycle air cleaner element assembly.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561170/Yamaha-Air-Filter.png",
    alt: "Yamaha motorcycle air cleaner element assembly",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-004",
    partNumber: "YAM-004",
    name: "Yamaha Element Assy, Oil Cleaner",
    brand: "Yamaha",
    category: "Accessories & Maintenance",
    description: "Yamaha motorcycle oil cleaner element assembly.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561179/Yamaha-Oil-Filter.png",
    alt: "Yamaha motorcycle oil cleaner element assembly",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-005",
    partNumber: "YAM-005",
    name: "Yamaha Spark Plug",
    brand: "Yamaha",
    category: "Electrical Parts",
    description: "Yamaha motorcycle spark plug.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561151/Yamaha-Spark-Plug.png",
    alt: "Yamaha motorcycle spark plug",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-006",
    partNumber: "YAM-006",
    name: "Yamaha Chain",
    brand: "Yamaha",
    category: "Transmission Parts",
    description: "Yamaha motorcycle chain.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561161/Yamaha-Chain.png",
    alt: "Yamaha motorcycle chain",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-007",
    partNumber: "YAM-007",
    name: "Yamaha Sprocket",
    brand: "Yamaha",
    category: "Transmission Parts",
    description: "Yamaha motorcycle sprocket.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561191/Yamaha-Sprocket.png",
    alt: "Yamaha motorcycle sprocket",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-008",
    partNumber: "YAM-008",
    name: "Yamaha Brake Shoe Set",
    brand: "Yamaha",
    category: "Brake Parts",
    description: "Yamaha motorcycle brake shoe set.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561143/Yamaha-Brake-Shoe.png",
    alt: "Yamaha motorcycle brake shoe set",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-009",
    partNumber: "YAM-009",
    name: "Yamalube Engine Oil",
    brand: "Yamaha",
    category: "Accessories & Maintenance",
    description: "Yamalube motorcycle engine oil.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561135/Yamalube-Engine-Oil.webp",
    alt: "Yamalube motorcycle engine oil",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-010",
    partNumber: "YAM-010",
    name: "Yamalube Super Chain Lube",
    brand: "Yamaha",
    category: "Accessories & Maintenance",
    description: "Yamalube motorcycle chain lubricant.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561179/Yamalube-Chain-Lube.png",
    alt: "Yamalube motorcycle chain lubricant",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-011",
    partNumber: "YAM-011",
    name: "Yamaha Rear Carrier Black",
    brand: "Yamaha",
    category: "Body & Exterior",
    description: "Yamaha motorcycle rear carrier.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561566/Yamaha-Rear-Carrier.png",
    alt: "Yamaha motorcycle rear carrier",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-012",
    partNumber: "YAM-012",
    name: "Yamaha USB Charger",
    brand: "Yamaha",
    category: "Electrical Parts",
    description: "Yamaha motorcycle USB charger.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561542/Yamaha-USB-Charger.png",
    alt: "Yamaha motorcycle USB charger",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-013",
    partNumber: "YAM-013",
    name: "Yamaha Reservoir Cap",
    brand: "Yamaha",
    category: "Suspension Parts",
    description: "Yamaha motorcycle reservoir cap.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561579/Yamaha-Reservoir-Cap.png",
    alt: "Yamaha motorcycle reservoir cap",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-014",
    partNumber: "YAM-014",
    name: "Yamaha Clutch Lever",
    brand: "Yamaha",
    category: "Transmission Parts",
    description: "Yamaha motorcycle clutch lever.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561581/Yamaha-Clutch-Lever.png",
    alt: "Yamaha motorcycle clutch lever",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-015",
    partNumber: "YAM-015",
    name: "Yamaha Wheel Rim",
    brand: "Yamaha",
    category: "Tires & Wheels",
    description: "Yamaha motorcycle wheel rim.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561559/Yamaha-Wheel-Rim.png",
    alt: "Yamaha motorcycle wheel rim",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-016",
    partNumber: "YAM-016",
    name: "Yamalube PEA Carbon Cleaner",
    brand: "Yamaha",
    category: "Accessories & Maintenance",
    description: "Yamalube motorcycle carbon cleaner.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561544/Yamalube-Carbon-Cleaner.png",
    alt: "Yamalube motorcycle carbon cleaner",
    availabilityStatus: "active",
    status: "active",
  },
  {
    id: "YAM-017",
    partNumber: "YAM-017",
    name: "Yamaha Brake Lever",
    brand: "Yamaha",
    category: "Brake Parts",
    description: "Yamaha motorcycle brake lever.",
    price: 0,
    image:
      "https://res.cloudinary.com/ykkjo51n/image/upload/v1787561562/Yamaha-Brake-Lever.png",
    alt: "Yamaha motorcycle brake lever",
    availabilityStatus: "active",
    status: "active",
  },
];

export const initialProductFilters: ProductFilterState = {
  brands: [],
  categories: [],
  availability: [],
  minPrice: 0,
  maxPrice: 10000,
};

export const productMaxPrice = 10000;
