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
      const { data: productFromStock } = await api.get<Stock>(`stock/${productId}`);

      let updatedCart = [...cart];

      const productInCart = updatedCart.find((product) => product.id === productId);

      if (!productInCart) {
        const { data: productFromProducts } = await api.get<Product>(`products/${productId}`);

        updatedCart.push({...productFromProducts, amount: 1});

        setCart(updatedCart);

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(updatedCart)
        );

        return;
      } 

      if (productFromStock.amount > productInCart.amount) {

        // uptadedCart.push({...productInCart, amount: productInCart.amount + 1});

        // a forma de cima cria um elemento a mais no carrinho, ao invés de apenas modificar

        // for (let product of updatedCart) {
        //   if (product.id === productId) {
        //     product.amount += 1;
        //   }
        // }

        updatedCart = updatedCart.map(product => {
          return product.id === productId ?
          {...product, amount: product.amount + 1}
          : product
        });

        setCart(updatedCart);

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(updatedCart)
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
      const updatedCart = [...cart];

      const cartProductIndex = updatedCart.findIndex(product => product.id === productId);

      const productInCart = updatedCart[cartProductIndex];

      if (!productInCart) {
        throw new Error;
      }

      updatedCart.splice(cartProductIndex, 1);

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch(error) {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stockProduct } = await api.get<Stock>(`stock/${productId}`);

      if ((stockProduct.amount < amount) || (amount < 1)) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      let updatedCart = [...cart];

      updatedCart = updatedCart.map((product) => {
        return product.id === productId ?
          { ...product, amount: amount }
          : product
      });

      setCart(updatedCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
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
