import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import {
  useAddItemMutation,
  useClearCartMutation,
  useGetCartQuery,
  useGetCatalogQuery,
  useRemoveItemMutation,
  useUpdateItemMutation,
} from './cartApi';

export function CartPage() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) {
    return (
      <section className="content">
        <p className="eyebrow">Cart</p>
        <h2>Your cart</h2>
        <p>
          Please <Link to="/login">sign in</Link> to view your cart.
        </p>
      </section>
    );
  }
  return <CartView />;
}

function CartView() {
  const { data: cart, isLoading, isError } = useGetCartQuery();
  const [updateItem] = useUpdateItemMutation();
  const [removeItem] = useRemoveItemMutation();
  const [clearCart, clearState] = useClearCartMutation();

  return (
    <section className="content">
      <p className="eyebrow">Cart</p>
      <h2>Your cart</h2>

      {isLoading && <p>Loading your cart…</p>}
      {isError && <p style={{ color: '#a33' }}>Could not load your cart. Please try again.</p>}

      {cart && cart.items.length === 0 && <p>Your cart is empty. Add something below.</p>}

      {cart && cart.items.length > 0 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #d8d5ca' }}>
                <th style={{ padding: 8 }}>Product</th>
                <th style={{ padding: 8 }}>Price</th>
                <th style={{ padding: 8 }}>Qty</th>
                <th style={{ padding: 8 }}>Total</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.productId} style={{ borderBottom: '1px solid #e4e1d7' }}>
                  <td style={{ padding: 8 }}>{item.name}</td>
                  <td style={{ padding: 8 }}>${item.unitPrice.toFixed(2)}</td>
                  <td style={{ padding: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        style={btn}
                        aria-label="Decrease"
                        onClick={() =>
                          item.quantity > 1
                            ? updateItem({ productId: item.productId, quantity: item.quantity - 1 })
                            : removeItem(item.productId)
                        }
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        style={btn}
                        aria-label="Increase"
                        onClick={() => updateItem({ productId: item.productId, quantity: item.quantity + 1 })}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: 8, fontWeight: 700 }}>${item.lineTotal.toFixed(2)}</td>
                  <td style={{ padding: 8 }}>
                    <button style={{ ...btn, background: '#a33' }} onClick={() => removeItem(item.productId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              style={{ ...btn, background: '#6b6f64' }}
              disabled={clearState.isLoading}
              onClick={() => clearCart()}
            >
              Clear cart
            </button>
            <p style={{ fontSize: 20 }}>
              Subtotal: <strong>${cart.subtotal.toFixed(2)}</strong> ({cart.itemCount} items)
            </p>
          </div>
        </>
      )}

      <AddProducts />
    </section>
  );
}

function AddProducts() {
  const { data: products, isLoading, isError } = useGetCatalogQuery();
  const [addItem, addState] = useAddItemMutation();

  return (
    <div style={{ marginTop: 40 }}>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Add products</h3>
      {isLoading && <p>Loading products…</p>}
      {isError && <p style={{ color: '#a33' }}>Could not load products.</p>}
      {products && products.length === 0 && <p>No products available yet.</p>}
      {products && products.length > 0 && (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {products.map((p) => (
            <article key={p.id} style={{ border: '1px solid #d8d5ca', padding: 14, background: '#fffdf8' }}>
              <strong>{p.name}</strong>
              <p style={{ fontWeight: 700, margin: '6px 0' }}>${p.price.toFixed(2)}</p>
              <button
                style={{ ...btn, marginTop: 4 }}
                disabled={p.stock <= 0 || addState.isLoading}
                onClick={() => addItem({ productId: p.id, quantity: 1 })}
              >
                {p.stock > 0 ? 'Add to cart' : 'Out of stock'}
              </button>
            </article>
          ))}
        </div>
      )}
      {addState.isError && <p style={{ color: '#a33' }}>Could not add to cart (check stock).</p>}
    </div>
  );
}

const btn: React.CSSProperties = { marginTop: 0, padding: '8px 12px' };
