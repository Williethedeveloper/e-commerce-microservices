import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';

// Set up axios defaults
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost';

const api = {
  auth: axios.create({ baseURL: `${API_BASE}:3001` }),
  user: axios.create({ baseURL: `${API_BASE}:3002` }),
  product: axios.create({ baseURL: `${API_BASE}:3003` }),
  cart: axios.create({ baseURL: `${API_BASE}:3004` }),
  order: axios.create({ baseURL: `${API_BASE}:3005` })
};

// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [token, setToken] = React.useState(localStorage.getItem('token'));

  React.useEffect(() => {
    if (token) {
      // Set token for all API calls
      Object.values(api).forEach(instance => {
        instance.defaults.headers.authorization = `Bearer ${token}`;
      });
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.auth.post('/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await api.auth.post('/register', { email, password, name });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

// Components
const Header = () => {
  const { user, logout, isAuthenticated } = React.useContext(AuthContext);
  
  return (
    <div className="header">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          <h1>🛒 E-Commerce Store</h1>
        </Link>
        <nav>
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span>Hello, {user?.name}</span>
              <Link to="/cart" style={{ color: 'white' }}>Cart</Link>
              <Link to="/orders" style={{ color: 'white' }}>Orders</Link>
              <button onClick={logout} className="btn">Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/login" style={{ color: 'white' }}>Login</Link>
              <Link to="/register" style={{ color: 'white' }}>Register</Link>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [products, setProducts] = React.useState([]);
  const { isAuthenticated } = React.useContext(AuthContext);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.product.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = async (productId) => {
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      return;
    }
    
    try {
      await api.cart.post('/cart/add', { productId, quantity: 1 });
      alert('Product added to cart!');
    } catch (error) {
      alert('Error adding to cart');
    }
  };

  return (
    <div className="container">
      <h2>Products</h2>
      <div className="products">
        {products.map(product => (
          <div key={product._id} className="product">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p><strong>${product.price}</strong></p>
            <p>Stock: {product.stock}</p>
            <button 
              className="btn" 
              onClick={() => addToCart(product._id)}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const { login } = React.useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      window.location.href = '/';
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <button type="submit" className="btn">Login</button>
      </form>
    </div>
  );
};

const RegisterPage = () => {
  const [formData, setFormData] = React.useState({ email: '', password: '', name: '' });
  const { register } = React.useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(formData.email, formData.password, formData.name);
    if (result.success) {
      window.location.href = '/';
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <button type="submit" className="btn">Register</button>
      </form>
    </div>
  );
};

const CartPage = () => {
  const [cart, setCart] = React.useState({ items: [] });
  const [products, setProducts] = React.useState({});

  React.useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await api.cart.get('/cart');
        setCart(response.data);
        
        // Fetch product details for cart items
        const productPromises = response.data.items.map(item =>
          api.product.get(`/products/${item.productId}`)
        );
        const productResponses = await Promise.all(productPromises);
        const productData = {};
        productResponses.forEach(res => {
          productData[res.data._id] = res.data;
        });
        setProducts(productData);
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };
    fetchCart();
  }, []);

  const removeFromCart = async (productId) => {
    try {
      await api.cart.delete(`/cart/remove/${productId}`);
      setCart(prev => ({
        ...prev,
        items: prev.items.filter(item => item.productId !== productId)
      }));
    } catch (error) {
      alert('Error removing item');
    }
  };

  const checkout = async () => {
    try {
      await api.order.post('/orders');
      alert('Order placed successfully!');
      setCart({ items: [] });
    } catch (error) {
      alert('Error placing order');
    }
  };

  const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="container">
      <h2>Shopping Cart</h2>
      {cart.items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <div>
          {cart.items.map(item => {
            const product = products[item.productId];
            return (
              <div key={item.productId} style={{ border: '1px solid #ddd', padding: '1rem', margin: '1rem 0', borderRadius: '4px' }}>
                <h3>{product?.name}</h3>
                <p>Quantity: {item.quantity}</p>
                <p>Price: ${item.price}</p>
                <p>Subtotal: ${item.price * item.quantity}</p>
                <button className="btn" onClick={() => removeFromCart(item.productId)}>Remove</button>
              </div>
            );
          })}
          <div style={{ marginTop: '2rem' }}>
            <h3>Total: ${total.toFixed(2)}</h3>
            <button className="btn" onClick={checkout}>Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
};

const OrdersPage = () => {
  const [orders, setOrders] = React.useState([]);

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.order.get('/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="container">
      <h2>My Orders</h2>
      {orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        orders.map(order => (
          <div key={order._id} style={{ border: '1px solid #ddd', padding: '1rem', margin: '1rem 0', borderRadius: '4px' }}>
            <h3>Order #{order._id.slice(-6)}</h3>
            <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            <p>Status: {order.status}</p>
            <p>Total: ${order.total}</p>
            <p>Items: {order.items.length}</p>
          </div>
        ))
      )}
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
