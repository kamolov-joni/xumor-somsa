import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import MapPicker from '../components/MapPicker';
import { addOrder } from '../utils/storage';
import '../styles/order-form.css';

const NewOrder = ({ onOrderCreated }) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    phone: '',
    address: '',
    location: null,
    products: [{ name: 'Somsa', quantity: '' }],
    notes: '',
    deliveryDate: today,
    deliveryTime: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData(prev => ({ ...prev, products: newProducts }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { name: '', quantity: '' }],
    }));
  };

  const removeProduct = (index) => {
    if (formData.products.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const handleLocationChange = (loc) => {
    setFormData(prev => ({ ...prev, location: loc }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customerName.trim()) newErrors.customerName = 'Mijoz ismi kiritilmagan';
    if (!formData.phone.trim()) newErrors.phone = 'Telefon raqami kiritilmagan';
    if (!formData.address.trim()) newErrors.address = 'Manzil kiritilmagan';
    if (!formData.deliveryDate) newErrors.deliveryDate = 'Sana tanlanmagan';
    if (!formData.deliveryTime) newErrors.deliveryTime = 'Vaqt tanlanmagan';
    
    const hasValidProduct = formData.products.some(p => p.name.trim() && p.quantity);
    if (!hasValidProduct) newErrors.products = 'Kamida bitta mahsulot kiriting';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    const orderData = {
      ...formData,
      title: formData.title || `${formData.customerName} — ${formData.products.map(p => `${p.quantity} ${p.name}`).join(', ')}`,
      products: formData.products.filter(p => p.name.trim() && p.quantity),
    };

    addOrder(orderData);
    toast.success('✅ Buyurtma muvaffaqiyatli yaratildi!');
    
    if (onOrderCreated) onOrderCreated();
    navigate('/');
  };

  return (
    <div className="new-order-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Orqaga</span>
        </button>
        <h1 className="page-title">Yangi buyurtma</h1>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        <div className="form-layout">
          {/* Left column - Form Fields */}
          <div className="form-fields glass">
            <h2 className="form-section-title">Buyurtma ma'lumotlari</h2>

            <div className="form-group">
              <label className="form-label">Buyurtma nomi (ixtiyoriy)</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Masalan: Ali uchun somsa"
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mijoz ismi *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Ali Valiyev"
                  className={`form-input ${errors.customerName ? 'form-input-error' : ''}`}
                />
                {errors.customerName && <span className="form-error">{errors.customerName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Telefon raqami *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+998901234567"
                  className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Yetkazib berish manzili *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Chilonzor 19-kvartal"
                className={`form-input ${errors.address ? 'form-input-error' : ''}`}
              />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Yetkazish sanasi *</label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className={`form-input ${errors.deliveryDate ? 'form-input-error' : ''}`}
                />
                {errors.deliveryDate && <span className="form-error">{errors.deliveryDate}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Yetkazish vaqti *</label>
                <input
                  type="time"
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleChange}
                  className={`form-input ${errors.deliveryTime ? 'form-input-error' : ''}`}
                />
                {errors.deliveryTime && <span className="form-error">{errors.deliveryTime}</span>}
              </div>
            </div>

            {/* Products */}
            <div className="form-group">
              <label className="form-label">Mahsulotlar *</label>
              {errors.products && <span className="form-error">{errors.products}</span>}
              <div className="products-list">
                {formData.products.map((product, index) => (
                  <div key={index} className="product-item glass">
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                      placeholder="Mahsulot nomi"
                      className="form-input product-name-input"
                    />
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                      placeholder="Soni"
                      min="1"
                      className="form-input product-qty-input"
                    />
                    <span className="product-unit">ta</span>
                    {formData.products.length > 1 && (
                      <button
                        type="button"
                        className="product-remove-btn"
                        onClick={() => removeProduct(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="add-product-btn" onClick={addProduct}>
                <Plus size={16} />
                Mahsulot qo'shish
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Izoh (ixtiyoriy)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Qo'shimcha izoh..."
                rows="3"
                className="form-input form-textarea"
              />
            </div>

            <button type="submit" className="submit-btn">
              <Save size={20} />
              Buyurtma yaratish
            </button>
          </div>

          {/* Right column - Map */}
          <div className="form-map-section glass">
            <h2 className="form-section-title">Lokatsiyani tanlang</h2>
            <p className="form-section-desc">Xaritada yetkazish joyini belgilang</p>
            <MapPicker
              location={formData.location}
              onLocationChange={handleLocationChange}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
