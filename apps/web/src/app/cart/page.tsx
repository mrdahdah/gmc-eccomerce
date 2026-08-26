'use client';
import Link from 'next/link';
import { useCart } from '@/providers/CartProvider';

export default function CartPage() {
  const { lines, setQty, remove, clear, subtotal, count } = useCart();

  if (lines.length === 0) {
    return (
      <>
        <h1 className="section-title">Your cart</h1>
        <p>
          Your cart is empty. <Link href="/products">Browse products</Link>.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="section-title">Your cart</h1>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.productId}>
              <td>{l.name}</td>
              <td>${l.price.toFixed(2)}</td>
              <td>
                <div className="qty">
                  <button onClick={() => setQty(l.productId, l.quantity - 1)} aria-label="Decrease">
                    −
                  </button>
                  <span>{l.quantity}</span>
                  <button onClick={() => setQty(l.productId, l.quantity + 1)} aria-label="Increase">
                    +
                  </button>
                </div>
              </td>
              <td>${(l.price * l.quantity).toFixed(2)}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => remove(l.productId)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="summary">
        <button className="btn btn-ghost" onClick={clear}>
          Clear cart
        </button>
        <span>
          Subtotal ({count}): <strong>${subtotal.toFixed(2)}</strong>
        </span>
      </div>
      <div style={{ marginTop: 20 }}>
        <Link className="btn btn-lg" href="/checkout">
          Checkout →
        </Link>
      </div>
    </>
  );
}
