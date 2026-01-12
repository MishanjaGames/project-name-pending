import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

function CartPage() {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, clearCart, totalItems, totalPrice } = useCart();

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Cart</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => navigate(-1)}>Continue shopping</button>
          <button className="btn btn-danger" onClick={() => clearCart()} disabled={items.length === 0}>Clear cart</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-info">Your cart is empty.</div>
      ) : (
        <div className="row">
          <div className="col-12 col-md-8">
            <ul className="list-group mb-3">
              {items.map((it) => (
                <li className="list-group-item d-flex justify-content-between align-items-center" key={it.id}>
                  <div className="d-flex align-items-center">
                    <img src={it.img || 'https://via.placeholder.com/80'} alt={it.title} style={{width:80,height:60,objectFit:'cover'}} className="me-3" />
                    <div>
                      <div><strong>{it.title}</strong></div>
                      <div className="text-muted">{it.description}</div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center">
                    <div className="me-3">${(Number(it.price) || 0).toFixed(2)}</div>
                    <div className="input-group input-group-sm me-3" style={{width:110}}>
                      <button className="btn btn-outline-secondary" onClick={() => updateQty(it.id, (it.qty || 1) - 1)}>-</button>
                      <input readOnly className="form-control text-center" value={it.qty} />
                      <button className="btn btn-outline-secondary" onClick={() => updateQty(it.id, (it.qty || 1) + 1)}>+</button>
                    </div>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => removeItem(it.id)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-12 col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Summary</h5>
                <p className="mb-1">Items: <strong>{totalItems}</strong></p>
                <p className="mb-3">Total: <strong>${totalPrice.toFixed(2)}</strong></p>
                <button className="btn btn-primary w-100" onClick={() => alert('Checkout flow not implemented')}>Checkout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
