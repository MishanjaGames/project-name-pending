import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { SettingsContext } from '../../contexts/SettingsContext';

function CartPage() {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const { t } = useContext(SettingsContext);

  // --- УМНЫЙ ПЕРЕВОДЧИК ---
  // Если библиотека возвращает сырой ключ (перевода нет), показываем fallback текст
  const safeTranslate = (key, fallback) => {
    const res = t(key);
    return res === key ? fallback : res;
  };

  // --- СОСТОЯНИЕ ПРОМОКОДА ---
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState({ type: '', text: '' });

  // Логика автоматической скидки (15% если товаров >= 10)
  const isAutoDiscountApplied = totalItems >= 10;
  const autoDiscountAmount = isAutoDiscountApplied ? totalPrice * 0.15 : 0;

  // Обработка промокода
  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'REACT') {
      setPromoDiscount(10); // Скидка $10
      setPromoMessage({ type: 'success', text: 'Promo code applied: -$10.00' });
    } else {
      setPromoDiscount(0);
      setPromoMessage({ type: 'error', text: 'Invalid promo code' });
    }
  };

  const checkoutHandler = () => {
    const userData = prompt(`Enter your payment details for $${finalPrice.toFixed(2)}:`);
    
    if (userData) {
      console.log("User entered:", userData);
      alert("Payment successful! (Simulated)");
    }

    clearCart();
    navigate('/search');
  };
  
  // Итоговая цена
  const finalPrice = Math.max(0, totalPrice - autoDiscountAmount - promoDiscount);

  const imgStyle = {
    width: '120px',
    height: '90px',
    objectFit: 'cover'
  };

  return (
    <div className="container py-5" style={{ maxWidth: '1100px' }}>
      
      {/* ЗАГОЛОВОК */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          {/* ИСПОЛЬЗУЕМ БЕЗОПАСНЫЙ ПЕРЕВОД */}
          <h2 className="fw-bold mb-1">{safeTranslate('cartTitle', 'Shopping Cart')}</h2>
          <p className="text-muted mb-0">
            {totalItems > 0 
              ? `You have ${totalItems} course${totalItems !== 1 ? 's' : ''} in your cart` 
              : safeTranslate('yourCartIsEmpty', 'Your cart is empty')}
          </p>
        </div>
        {totalItems > 0 && (
          <button 
            className="btn btn-outline-danger rounded-pill px-4" 
            onClick={() => { if(window.confirm('Are you sure?')) clearCart(); }}
          >
            <i className="bi bi-trash3 me-2"></i> {safeTranslate('clear', 'Clear Cart')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
      // ПУСТАЯ КОРЗИНА
        <div className="text-center py-5">
          {/* Поменял bg-light на bg-secondary bg-opacity-10, чтобы в темной теме кружок было видно */}
          <div className="bg-secondary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
            <i className="bi bi-cart-x fs-1 text-muted"></i>
          </div>
          {/* ИСПОЛЬЗУЕМ БЕЗОПАСНЫЙ ПЕРЕВОД */}
          <h4 className="fw-bold mb-3">{safeTranslate('yourCartIsEmpty', 'Your cart is empty')}</h4>
          <p className="text-muted mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
            {safeTranslate('cart.emptyDesc', "Looks like you haven't added any courses yet. Explore our catalog to find something interesting!")}
          </p>
          <button className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm" onClick={() => navigate('/search')}>
            {safeTranslate('cart.startShopping', "Start Shopping")}
          </button>
        </div>
      ) : (
        // СОДЕРЖИМОЕ КОРЗИНЫ
        <div className="row g-4">
          
          {/* ЛЕВЫЙ СТОЛБЕЦ: ТОВАРЫ */}
          <div className="col-12 col-lg-8">
            <div className="d-grid gap-3">
              {items.map((it) => (
                <div className="card border-0 shadow-sm overflow-hidden" key={it.id}>
                  <div className="card-body p-3">
                    <div className="d-flex flex-column flex-md-row align-items-center gap-4">
                      
                      {/* Изображение */}
                      <img 
                        src={it.img || 'https://via.placeholder.com/150'} 
                        alt={it.title} 
                        className="rounded-3 shadow-sm" 
                        style={imgStyle} 
                      />

                      {/* Содержимое */}
                      <div className="flex-grow-1 text-center text-md-start">
                        <h5 className="fw-bold mb-1">{it.title}</h5>
                        <p className="text-muted small mb-2">{it.author || 'Unknown Author'}</p>
                        <div className="badge bg-primary bg-opacity-10 text-primary rounded-pill">
                          Lifetime Access
                        </div>
                      </div>

                      {/* Цена и элементы управления */}
                      <div className="d-flex flex-column align-items-center align-items-md-end gap-2" style={{ minWidth: '140px' }}>
                        <div className="fs-4 fw-bold text-primary">
                          ${(Number(it.price) * (it.qty || 1)).toFixed(2)}
                        </div>
                        
                        <div className="input-group input-group-sm" style={{ width: '100px' }}>
                          <button className="btn btn-outline-secondary" onClick={() => updateQty(it.id, (it.qty || 1) - 1)}>-</button>
                          <input 
                            readOnly 
                            className="form-control text-center border-secondary border-opacity-25" 
                            value={it.qty || 1} 
                          />
                          <button className="btn btn-outline-secondary" onClick={() => updateQty(it.id, (it.qty || 1) + 1)}>+</button>
                        </div>

                        <button 
                          className="btn btn-link text-danger text-decoration-none p-0 small mt-1" 
                          onClick={() => removeItem(it.id)}
                        >
                          <i className="bi bi-x-circle me-1"></i> Remove
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px', zIndex: 10 }}>
              <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                <h5 className="fw-bold mb-0">Summary</h5>
              </div>
              <div className="card-body p-4">
                
                {/* ЦЕНЫ */}
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal</span>
                  <span className="fw-bold">${totalPrice.toFixed(2)}</span>
                </div>
                
                {/* Автоматическая скидка */}
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">
                    Bulk Discount 
                    {isAutoDiscountApplied && <span className="badge bg-success ms-2">15%</span>}
                  </span>
                  <span className={isAutoDiscountApplied ? "text-success fw-bold" : "text-muted"}>
                    -${autoDiscountAmount.toFixed(2)}
                  </span>
                </div>

                {/* Скидка по промокоду */}
                {promoDiscount > 0 && (
                   <div className="d-flex justify-content-between mb-2">
                     <span className="text-muted">Promo Code</span>
                     <span className="text-success fw-bold">-${promoDiscount.toFixed(2)}</span>
                   </div>
                )}

                {/* --- БЛОК ПРОМОКОДА --- */}
                <div className="mt-3 mb-3">
                  <label className="form-label small text-muted text-uppercase fw-bold">Have a promo code?</label>
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Try 'REACT'"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button className="btn btn-outline-primary" onClick={handleApplyPromo}>Apply</button>
                  </div>
                  {/* Сообщения об ошибке/успехе */}
                  {promoMessage.text && (
                    <div className={`small mt-1 ${promoMessage.type === 'error' ? 'text-danger' : 'text-success'}`}>
                      {promoMessage.text}
                    </div>
                  )}
                </div>

                {/* Подсказка для авто-скидки */}
                {!isAutoDiscountApplied && (
                  <div className="alert alert-warning py-2 small mb-3">
                    Add <strong>{10 - totalItems}</strong> more courses to get <strong>15% bulk discount</strong>!
                  </div>
                )}
                
                <hr className="opacity-10" />
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fs-5 fw-bold">Total</span>
                  <span className="fs-3 fw-bold text-primary">${finalPrice.toFixed(2)}</span>
                </div>

                <button 
                  className="btn btn-primary w-100 py-3 rounded-pill shadow fw-bold mb-3" 
                  onClick={() => checkoutHandler()}
                >
                  Checkout Now
                </button>
                
                <button 
                  className="btn btn-outline-secondary w-100 py-2 rounded-pill border-0" 
                  onClick={() => navigate('/search')}
                >
                  Continue Shopping
                </button>

                <div className="mt-4 text-center">
                  <p className="text-muted small mb-2">We accept</p>
                  <div className="d-flex justify-content-center gap-2 text-muted fs-4">
                    <i className="bi bi-credit-card-2-front"></i>
                    <i className="bi bi-paypal"></i>
                    <i className="bi bi-apple"></i>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default CartPage;