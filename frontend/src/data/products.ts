import { Product } from "@/types";

export const products: Product[] = [
  {
    id: "p1",
    slug: "signature-lace-pro",
    name: "Signature Lace Pro",
    shortDescription: "Breathable lace hair patch with natural front line.",
    description:
      "Our most requested men\'s patch unit with an ultra-thin lace front and hand-knotted density for invisible blending and all-day comfort.",
    category: "Lace Base",
    basePrice: 129,
    rating: 4.9,
    reviewCount: 142,
    tags: ["Natural Hairline", "Breathable", "Best Seller"],
    images: [
      "https://images.unsplash.com/photo-1503951458645-643d53bfd90f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1559551409-dadc959f76b8?auto=format&fit=crop&w=1200&q=80"
    ],
    variants: [
      { id: "v1", label: "6x8 (Natural Black)", price: 129, stock: 24 },
      { id: "v2", label: "7x9 (Dark Brown)", price: 139, stock: 11 }
    ],
    featured: true
  },
  {
    id: "p2",
    slug: "royal-skin-hd",
    name: "Royal Skin HD",
    shortDescription: "Second-skin poly base with realistic scalp effect.",
    description: "A premium ultra-thin skin base crafted for an HD scalp finish and sleek styling versatility.",
    category: "Skin Base",
    basePrice: 149,
    rating: 4.8,
    reviewCount: 93,
    tags: ["HD Finish", "Low Maintenance"],
    images: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?auto=format&fit=crop&w=1200&q=80"
    ],
    variants: [
      { id: "v3", label: "6x8 (Jet Black)", price: 149, stock: 8 },
      { id: "v4", label: "7x9 (Natural Brown)", price: 159, stock: 16 }
    ],
    featured: true
  },
  {
    id: "p3",
    slug: "urban-volume-lace",
    name: "Urban Volume Lace",
    shortDescription: "Medium-density lace patch for textured hairstyles.",
    description: "Made for volume-focused looks with a balance of realism, hold, and breathability.",
    category: "Lace Base",
    basePrice: 119,
    rating: 4.7,
    reviewCount: 61,
    tags: ["Textured Style", "Everyday Wear"],
    images: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=1200&q=80"
    ],
    variants: [
      { id: "v5", label: "6x8 (Dark Brown)", price: 119, stock: 20 },
      { id: "v6", label: "7x9 (Soft Black)", price: 129, stock: 14 }
    ]
  },
  {
    id: "p4",
    slug: "alpha-edge-skin",
    name: "Alpha Edge Skin",
    shortDescription: "Athleisure-ready skin base with sweat resilience.",
    description: "Designed for active lifestyles with durable bonding support and a natural edge profile.",
    category: "Skin Base",
    basePrice: 139,
    rating: 4.6,
    reviewCount: 49,
    tags: ["Active Wear", "Durable"],
    images: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522556189639-b150e6e5273e?auto=format&fit=crop&w=1200&q=80"
    ],
    variants: [
      { id: "v7", label: "6x8 (Natural Black)", price: 139, stock: 19 },
      { id: "v8", label: "7x9 (Dark Brown)", price: 149, stock: 6 }
    ]
  },
  {
    id: "p5",
    slug: "precision-bond-kit",
    name: "Precision Bond Kit",
    shortDescription: "All-in-one adhesive and cleanup essentials.",
    description: "A complete maintenance bundle including tape, liquid bond, remover, and scalp prep.",
    category: "Maintenance",
    basePrice: 59,
    rating: 4.9,
    reviewCount: 178,
    tags: ["Starter Kit", "Pro Results"],
    images: [
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1567721913486-6585f069b332?auto=format&fit=crop&w=1200&q=80"
    ],
    variants: [
      { id: "v9", label: "Standard", price: 59, stock: 40 },
      { id: "v10", label: "Pro", price: 79, stock: 22 }
    ],
    featured: true
  },
  {
    id: "p6",
    slug: "daily-care-serum",
    name: "Daily Care Serum",
    shortDescription: "Lightweight nourishment spray for patch longevity.",
    description: "Keeps strands hydrated and soft without residue buildup.",
    category: "Maintenance",
    basePrice: 29,
    rating: 4.5,
    reviewCount: 35,
    tags: ["Hydration", "No Build-Up"],
    images: [
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80"
    ],
    variants: [{ id: "v11", label: "100ml", price: 29, stock: 45 }]
  }
];

export const categories = ["All", "Lace Base", "Skin Base", "Maintenance"] as const;

export const sortOptions = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating" }
] as const;
