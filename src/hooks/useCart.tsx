import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: productFromStock } = await api.get(`stock/${productId}`);

      const uptadedCart = [...cart];

      const productInCart = uptadedCart.find((product) => product.id === productId);

      if (!productInCart) {
        const { data: productFromProducts } = await api.get<Product>(`products/${productId}`);

        uptadedCart.push({...productFromProducts, amount: 1});

        setCart(uptadedCart);

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(uptadedCart)
        );

        return;
      }

      if (productFromStock.amount > productInCart.amount) {

        uptadedCart.push({...productInCart, amount: productInCart.amount + 1});

        setCart(uptadedCart);

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(uptadedCart)
        );
      } else {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const uptadedCart = [...cart];

      const cartProductIndex = uptadedCart.findIndex(product => product.id === productId);

      const productInCart = uptadedCart[cartProductIndex];

      if (!productInCart) {
        throw new Error;
      }

      uptadedCart.splice(cartProductIndex, 1);

      setCart(uptadedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(uptadedCart));
    } catch(error) {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stockProduct } = await api.get<Product>(`stock/${productId}`);

      if ((stockProduct.amount < amount) || (amount < 1)) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      let uptadedCart = [...cart];

      uptadedCart = uptadedCart.map((product) => {
        return product.id === productId ?
          { ...product, amount: amount }
          : product
      });

      // [{"amount": 2, "id": 1, "image": "https://rocketseat-cdn.s3-sa-east-1.amazonaws.com/modulo-redux/tenis1.jpg", "price": 179.9, "title": "Tênis de Caminhada Leve Confortável"}, {"amount": 1, "id": 2, "image": "https://rocketseat-cdn.s3-sa-east-1.amazonaws.com/modulo-redux/tenis2.jpg", "price": 139.9, "title": "Tênis VR Caminhada Confortável Detalhes Couro Masculino"}]

      // [{"amount": 2, "id": 1, "image": "https://rocketseat-cdn.s3-sa-east-1.amazonaws.com/modulo-redux/tenis1.jpg", "price": 179.9, "title": "Tênis de Caminhada Leve Confortável"}, {"amount": 0, "id": 2, "image": "https://rocketseat-cdn.s3-sa-east-1.amazonaws.com/modulo-redux/tenis2.jpg", "price": 139.9, "title": "Tênis VR Caminhada Confortável Detalhes Couro Masculino"}]

      setCart(uptadedCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(uptadedCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
