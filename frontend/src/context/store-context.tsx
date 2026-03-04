"use client";

import { products } from "@/data/products";
import { apiRequest } from "@/lib/api";
import { auth } from "@/lib/firebase-client";
import { CartItemType, Product } from "@/types";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type StoreContextType = {
  cartItems: CartItemType[];
  wishlist: string[];
  addToCart: (productId: string, variantId?: string) => void;
  updateCartQty: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  toggleWishlist: (productId: string) => void;
  moveWishlistToCart: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  cartCount: number;
  cartSubtotal: number;
  getCartProduct: (item: CartItemType) => Product | undefined;
  user: User | null;
  authReady: boolean;
  isAuthenticated: boolean;
  goToAuth: (nextPath?: string) => void;
  logout: () => Promise<void>;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const shippingFee = 12;
const CART_KEY = "hairiq_cart_items";
const WISHLIST_KEY = "hairiq_wishlist_items";
const SESSION_KEY = "hairiq_session_started_at";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const persistedCart = localStorage.getItem(CART_KEY);
    const persistedWishlist = localStorage.getItem(WISHLIST_KEY);

    if (persistedCart) {
      try {
        setCartItems(JSON.parse(persistedCart));
      } catch {
        localStorage.removeItem(CART_KEY);
      }
    }

    if (persistedWishlist) {
      try {
        setWishlist(JSON.parse(persistedWishlist));
      } catch {
        localStorage.removeItem(WISHLIST_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAuthReady(true);
        return;
      }

      const sessionStartedAt = Number(localStorage.getItem(SESSION_KEY) ?? Date.now());
      const sessionExpired = Date.now() - sessionStartedAt > SESSION_TTL_MS;

      if (sessionExpired) {
        await signOut(auth);
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
        setAuthReady(true);
        return;
      }

      if (!localStorage.getItem(SESSION_KEY)) {
        localStorage.setItem(SESSION_KEY, String(Date.now()));
      }

      setUser(firebaseUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const goToAuth = (nextPath?: string) => {
    const target = nextPath ?? pathname ?? "/";
    router.push(`/auth?next=${encodeURIComponent(target)}`);
  };

  const ensureAuthenticated = (nextPath?: string) => {
    if (user) {
      return true;
    }

    goToAuth(nextPath);
    return false;
  };

  const addToCart = (productId: string, variantId?: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const selectedVariant = variantId ?? product.variants[0]?.id;
    if (!selectedVariant) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === productId && item.variantId === selectedVariant);
      if (existing) {
        return prev.map((item) =>
          item.itemId === existing.itemId ? { ...item, quantity: Math.min(item.quantity + 1, 10) } : item
        );
      }

      return [
        ...prev,
        {
          itemId: `${productId}-${selectedVariant}`,
          productId,
          variantId: selectedVariant,
          quantity: 1
        }
      ];
    });
  };

  const updateCartQty = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCartItems((prev) => prev.map((item) => (item.itemId === itemId ? { ...item, quantity: Math.min(quantity, 10) } : item)));
  };

  const removeFromCart = (itemId: string) => setCartItems((prev) => prev.filter((item) => item.itemId !== itemId));

  const toggleWishlist = (productId: string) => {
    if (!ensureAuthenticated("/wishlist")) {
      return;
    }

    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
  };

  const moveWishlistToCart = (productId: string) => {
    addToCart(productId);
    setWishlist((prev) => prev.filter((id) => id !== productId));
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const cartSubtotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        const variant = product?.variants.find((v) => v.id === item.variantId);
        return sum + (variant?.price ?? product?.basePrice ?? 0) * item.quantity;
      }, 0),
    [cartItems]
  );

  const getCartProduct = (item: CartItemType) => products.find((p) => p.id === item.productId);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("hairiq_server_token");
    setUser(null);
    router.push("/");
  };

  useEffect(() => {
    const syncUserWithBackend = async () => {
      if (!user) return;

      try {
        const idToken = await user.getIdToken();
        const response = await apiRequest<{
          success: true;
          data: {
            token: string;
            user: { id: string; name: string; phone: string; email: string | null; role: string };
            needsProfile: boolean;
            isNewUser: boolean;
          };
        }>(
          "/auth/verify-firebase",
          {
            method: "POST",
            body: JSON.stringify({
              idToken
            })
          }
        );
        localStorage.setItem("hairiq_server_token", response.data.token);
      } catch {
        // Keep UI responsive even if backend sync temporarily fails.
      }
    };

    void syncUserWithBackend();
  }, [user]);

  return (
    <StoreContext.Provider
      value={{
        cartItems,
        wishlist,
        addToCart,
        updateCartQty,
        removeFromCart,
        toggleWishlist,
        moveWishlistToCart,
        isWishlisted,
        cartCount,
        cartSubtotal: cartItems.length ? cartSubtotal + shippingFee : 0,
        getCartProduct,
        user,
        authReady,
        isAuthenticated: !!user,
        goToAuth,
        logout
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
};
