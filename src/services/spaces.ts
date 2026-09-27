import type { PyeSpace } from "@/types";

/** PYE Spaces are static product categories, not user data. */
export const PYE_SPACES: PyeSpace[] = [
  {
    id: "space_tech",
    name: "Technology & AI",
    slug: "technology",
    description: "Spatial computing, neural interfaces, open architecture, and high-performance software.",
    icon: "🚀",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80",
    category: "Technology",
  },
  {
    id: "space_gaming",
    name: "Gaming & XR",
    slug: "gaming",
    description: "Virtual worlds, multiplayer arcades, interactive simulations, and engine tech.",
    icon: "🎮",
    banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80",
    category: "Entertainment",
  },
  {
    id: "space_music",
    name: "Music & Audio",
    slug: "music",
    description: "Modular synthesis, spatial acoustic stems, generative frequencies, and original soundbites.",
    icon: "🎵",
    banner: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80",
    category: "Creative",
  },
  {
    id: "space_science",
    name: "Science & Cosmos",
    slug: "science",
    description: "Astrophysics, planetary data, quantum computing, and frontier physics.",
    icon: "🔬",
    banner: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1000&auto=format&fit=crop&q=80",
    category: "Education",
  },
  {
    id: "space_art",
    name: "Art & Motion",
    slug: "art",
    description: "Generative shaders, 3D motion design, typography, and visual installations.",
    icon: "🎨",
    banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80",
    category: "Creative",
  },
  {
    id: "space_future",
    name: "Future & Protocols",
    slug: "future",
    description: "Open protocols, cryptographic identity, decentralized social networks, and spatial worlds.",
    icon: "🌐",
    banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80",
    category: "Future",
  },
];
