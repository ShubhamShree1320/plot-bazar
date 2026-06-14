export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PlotCoordinate = {
  x: number;
  y: number;
  label: string;
};

export type PlotFilter = {
  state?: string;
  city?: string;
  locality?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  status?: string;
  sortBy?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
};

export type PlotWithDetails = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  area: number;
  areaUnit: string;
  state: string;
  city: string;
  locality: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  tokenAmount: number | null;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
  images: PlotImageType[];
  seller: {
    id: string;
    name: string;
  };
  _count?: {
    tokenPayments: number;
  };
};

export type PlotImageType = {
  id: string;
  plotId: string;
  imageName: string;
  imageUrl: string;
  coordinates: PlotCoordinate[] | null;
  isPrimary: boolean;
  order: number;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  isBlocked: boolean;
  isVerified: boolean;
  freeListingsUsed: number;
};
