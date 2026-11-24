import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { load, save } from '../services/storage';
import { calcTotals, PROMOS } from '../utils/pricing';

const CartContext = createContext(null);

const initialState = { items: [], promoCode: null };

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { product, qty } = action;
      const existing = state.items.find((i) => i.id === product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, product.stock), stock: product.stock } : i
          ),
        };
      }
      const snapshot = {
        id: product.id,
        name: product.name,
        price: product.price,
        emoji: product.emoji,
        color: product.color,
        stock: product.stock,
        qty: Math.min(qty, product.stock),
      };
      return { ...state, items: [...state.items, snapshot] };
    }
    case 'setQty':
      return {
        ...state,
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, qty: Math.max(0, Math.min(action.qty, i.stock)) } : i))
          .filter((i) => i.qty > 0),
      };
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case 'clear':
      return initialState;
    case 'applyPromo':
      return { ...state, promoCode: action.code };
    case 'removePromo':
      return { ...state, promoCode: null };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => load('cart', initialState));

  useEffect(() => {
    save('cart', state);
  }, [state]);

  const value = useMemo(() => {
    const count = state.items.reduce((s, i) => s + i.qty, 0);
    return {
      items: state.items,
      promoCode: state.promoCode,
      count,
      totals: calcTotals(state.items, state.promoCode),
      add: (product, qty = 1) => dispatch({ type: 'add', product, qty }),
      setQty: (id, qty) => dispatch({ type: 'setQty', id, qty }),
      remove: (id) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'clear' }),
      applyPromo: (raw) => {
        const code = raw.trim().toUpperCase();
        if (!PROMOS[code]) return false;
        dispatch({ type: 'applyPromo', code });
        return true;
      },
      removePromo: () => dispatch({ type: 'removePromo' }),
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
