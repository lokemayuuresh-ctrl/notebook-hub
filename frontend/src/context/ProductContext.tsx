import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types';
import { products as defaultProducts, categories as defaultCategories } from '@/data/products';
import { API_BASE_URL } from '@/lib/api';

interface ProductContextType {
  products: Product[];
  categories: string[];
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviews'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getSellerProducts: (sellerId: string) => Product[];
  getProductById: (id: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);

  useEffect(() => {
    // Try to fetch from backend API; fall back to local data if unavailable
    const fetchProducts = async () => {
      const base = API_BASE_URL;
      try {
        const res = await fetch(`${base}/api/products`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        // Map backend _id to id for compatibility with frontend types
        const mapped = data.map((p: any) => ({
          id: p._id || p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          category: p.category,
          stock: p.stock,
          rating: p.rating || 0,
          reviews: p.reviews || 0,
          sellerId: p.sellerId?._id || p.sellerId,
          sellerName: p.sellerName || p.sellerId?.name || 'Seller'
        }));

        // Deduplicate: backend products take precedence
        const backendIds = new Set(mapped.map((p: any) => String(p.id)));

        // Load local seller products (if any)
        let localSellerProducts: Product[] = [];
        const storedProducts = localStorage.getItem('sellerProducts');
        if (storedProducts) {
          try {
            const parsed = JSON.parse(storedProducts);
            localSellerProducts = parsed.filter((p: any) =>
              String(p.id).startsWith('seller-') && !backendIds.has(String(p.id))
            );
          } catch (e) {
            console.error('Failed to parse sellerProducts', e);
          }
        }

        const finalProducts = [...mapped, ...localSellerProducts];

        // Final safety check to ensure absolutely no duplicate IDs
        const uniqueProducts = [];
        const seenIds = new Set();
        for (const p of finalProducts) {
          const strId = String(p.id);
          if (!seenIds.has(strId)) {
            uniqueProducts.push(p);
            seenIds.add(strId);
          }
        }

        setProducts(uniqueProducts);
        // Sync categories
        const cats = new Set(defaultCategories);
        uniqueProducts.forEach(p => cats.add(p.category));
        setCategories(Array.from(cats));
        return;
      } catch (err) {
        // fallback to static data
        const storedProducts = localStorage.getItem('sellerProducts');
        let finalFallback = [...defaultProducts];

        if (storedProducts) {
          try {
            const sellerProducts = JSON.parse(storedProducts);
            finalFallback = [...finalFallback, ...sellerProducts];
          } catch (e) { }
        }

        // Deduplicate fallback data and fix ports
        const uniqueFallback = [];
        const seenFIds = new Set();
        for (const p of finalFallback) {
          if (p.id && !seenFIds.has(String(p.id))) {
            if (p.image && p.image.includes(':5001/uploads')) {
              p.image = p.image.replace(':5001/uploads', ':5000/uploads');
            }
            uniqueFallback.push(p);
            seenFIds.add(String(p.id));
          }
        }
        setProducts(uniqueFallback);
      }
    };

    fetchProducts();
  }, []);

  const saveSellerProducts = (allProducts: Product[]) => {
    const sellerProducts = allProducts.filter(p => p.sellerId);
    localStorage.setItem('sellerProducts', JSON.stringify(sellerProducts));
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'rating' | 'reviews'>): Promise<Product> => {
    // Try to persist on backend
    const base = API_BASE_URL;
    try {
      let res;
      // If productData contains a File under `imageFile`, use multipart/form-data
      const anyData: any = productData as any;
      if (anyData.imageFile instanceof File) {
        const fd = new FormData();
        fd.append('name', anyData.name);
        fd.append('description', anyData.description || '');
        fd.append('price', String(anyData.price));
        fd.append('category', anyData.category);
        fd.append('stock', String(anyData.stock || 0));
        // allow an optional imageUrl
        if (anyData.image) fd.append('image', anyData.image);
        fd.append('imageFile', anyData.imageFile);
        res = await fetch(`${base}/api/products`, {
          method: 'POST',
          credentials: 'include',
          body: fd
        });
      } else {
        res = await fetch(`${base}/api/products`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...productData })
        });
      }
      if (res.ok) {
        const p = await res.json();
        const mapped: Product = {
          id: p._id || p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          category: p.category,
          stock: p.stock,
          rating: p.rating || 0,
          reviews: p.reviews || 0,
          sellerId: p.sellerId,
          sellerName: p.sellerName
        };
        const updatedProducts = [...products, mapped];
        setProducts(updatedProducts);
        saveSellerProducts(updatedProducts);
        if (!categories.includes(mapped.category)) setCategories([...categories, mapped.category]);
        return mapped;
      }
    } catch (err) {
      // ignore and fallback to local
    }

    // Fallback - local seller product
    const newProduct: Product = {
      ...productData,
      id: `seller-${Date.now()}`,
      rating: 0,
      reviews: 0
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    saveSellerProducts(updatedProducts);

    // Add category if new
    if (!categories.includes(productData.category)) {
      setCategories([...categories, productData.category]);
    }

    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const base = API_BASE_URL;
    const product = products.find(p => p.id === id);
    // If product looks like a backend product (id is an objectId-like string), try backend update
    const useBackend = product && !product.id.startsWith('seller-');
    if (useBackend) {
      try {
        let res;
        const anyUpd: any = updates as any;
        if (anyUpd.imageFile instanceof File) {
          const fd = new FormData();
          Object.keys(anyUpd).forEach(k => {
            if (k === 'imageFile') return;
            const v = (anyUpd as any)[k];
            if (v !== undefined && v !== null) fd.append(k, String(v));
          });
          fd.append('imageFile', anyUpd.imageFile);
          res = await fetch(`${base}/api/products/${id}`, {
            method: 'PUT',
            credentials: 'include',
            body: fd
          });
        } else {
          res = await fetch(`${base}/api/products/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
          });
        }
        if (res.ok) {
          const p = await res.json();
          const mapped: Product = {
            id: p._id || p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.image,
            category: p.category,
            stock: p.stock,
            rating: p.rating || 0,
            reviews: p.reviews || 0
          };
          const updatedProducts = products.map(pr => pr.id === id ? { ...pr, ...mapped } : pr);
          setProducts(updatedProducts);
          saveSellerProducts(updatedProducts);
          return;
        }
      } catch (err) {
        // fallback to local
      }
    }

    // Local fallback update
    const updatedProducts = products.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    setProducts(updatedProducts);
    saveSellerProducts(updatedProducts);
  };

  const deleteProduct = async (id: string) => {
    const base = API_BASE_URL;
    const product = products.find(p => p.id === id);
    const useBackend = product && !product.id.startsWith('seller-');
    if (useBackend) {
      try {
        const res = await fetch(`${base}/api/products/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const updatedProducts = products.filter(p => p.id !== id);
          setProducts(updatedProducts);
          saveSellerProducts(updatedProducts);
          return;
        }
      } catch (err) {
        // fallback
      }
    }

    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    saveSellerProducts(updatedProducts);
  };

  const getSellerProducts = (sellerId: string) => {
    return products.filter(p => p.sellerId === sellerId);
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  return (
    <ProductContext.Provider value={{
      products,
      categories,
      addProduct,
      updateProduct,
      deleteProduct,
      getSellerProducts,
      getProductById
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
