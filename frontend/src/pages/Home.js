import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Pagination from '../components/Pagination';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { CURATED_CATEGORIES, CURATED_PRODUCTS } from '../data/curatedProducts';

const PAGE_SIZE = 56; // 7 rows of 8 products = 56 products per page

// Exact high-resolution category avatars with royal gold aura
const CATEGORY_AVATARS = {
  'Groceries & Gourmet': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop',
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop',
  "Men's Fashion": 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=200&h=200&fit=crop',
  "Women's Fashion": 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=200&fit=crop',
  'Beauty & Personal Care': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop',
  'Home & Kitchen': 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=200&h=200&fit=crop',
  'Home Decor & Lighting': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&h=200&fit=crop',
  'Books & Learning': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=200&fit=crop',
};

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop';

// Royal Hero promotional banners
const HERO_SLIDES = [
  {
    id: 1,
    tag: 'ROYAL TECH & AUDIO ATELIER',
    title: 'Up to 60% Privileged Savings on Studio Peripherals',
    sub: 'Elevate your workspace with Hi-Res ANC headsets, custom tactile keyboards and precision crafted accessories.',
    bg: 'linear-gradient(135deg, #090e1a 0%, #172554 45%, #1e1b4b 100%)',
    cta: 'Explore Electronics',
    categorySearch: 'electronics',
    badge: 'Royal Privilege Deal',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&fit=crop',
  },
  {
    id: 2,
    tag: 'GOURMET & ARTISANAL HARVEST',
    title: 'Kashmiri Saffron, A2 Desi Ghee & Raw Honey',
    sub: 'Pure Himalayan organic harvest, traditional cold-pressed oils, and royal kitchen reserve delicacies.',
    bg: 'linear-gradient(135deg, #06261c 0%, #064e3b 45%, #14532d 100%)',
    cta: 'Shop Groceries & Gourmet',
    categorySearch: 'groceries',
    badge: '100% Organic Certified',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&fit=crop',
  },
  {
    id: 3,
    tag: 'HERITAGE BANARASI & COUTURE',
    title: 'Handwoven Kanjivaram Silks & Festive Luxury',
    sub: 'Intricate golden zari jaal weaves, pure Anarkali couture sets and heirloom jewelry designed for grandeur.',
    bg: 'linear-gradient(135deg, #2b0614 0%, #831843 50%, #4c0519 100%)',
    cta: 'Shop Women’s Fashion',
    categorySearch: 'saree',
    badge: 'Heritage Craft',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&fit=crop',
  },
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Flash sale countdown timer state (3 hours, 45 mins countdown)
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 42, seconds: 18 });

  // Quick filter states
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [ratingFilter, setRatingFilter] = useState('');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const ordering = searchParams.get('ordering') || '';

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const slideTimerRef = useRef(null);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hero carousel auto-advance
  useEffect(() => {
    slideTimerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(slideTimerRef.current);
  }, []);

  // Fetch categories with fallback
  useEffect(() => {
    api.get('/products/categories/')
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          const hasGroceries = data.some((c) => c.name.toLowerCase().includes('grocer'));
          if (!hasGroceries) {
            setCategories([...CURATED_CATEGORIES.slice(0, 1), ...data]);
          } else {
            setCategories(data);
          }
        } else {
          setCategories(CURATED_CATEGORIES);
        }
      })
      .catch(() => setCategories(CURATED_CATEGORIES));
  }, []);

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryId, ordering, maxPriceFilter, inStockOnly, ratingFilter]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      if (categoryId) params.category = categoryId;
      if (ordering) params.ordering = ordering;

      let results = [];
      let totalCount = 0;

      try {
        const { data } = await api.get('/products/products/', { params });
        if (data && data.results && data.results.length > 0) {
          results = data.results;
          totalCount = data.count || results.length;
        }
      } catch (e) {
        // Fallback to local curated catalogue if API is unreachable
      }

      // If backend returns fewer than PAGE_SIZE (e.g. 8 items) and no active search/category filter,
      // seamlessly enrich with our 56 curated catalog products so all 7 rows of 8 products appear
      if (results.length < PAGE_SIZE && (!search && !categoryId)) {
        const existingIds = new Set(results.map((p) => p.id));
        const fillers = CURATED_PRODUCTS.filter((p) => !existingIds.has(p.id));
        results = [...results, ...fillers].slice(0, PAGE_SIZE);
        totalCount = Math.max(totalCount, results.length);
      } else if (results.length === 0) {
        // Filter curated products client-side for search/category
        let filtered = [...CURATED_PRODUCTS];
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.category_name && p.category_name.toLowerCase().includes(q)) ||
              (p.description && p.description.toLowerCase().includes(q))
          );
        }
        if (categoryId) {
          const selectedCat = (categories.length ? categories : CURATED_CATEGORIES).find(
            (c) => String(c.id) === String(categoryId)
          );
          if (selectedCat) {
            const catName = selectedCat.name.toLowerCase();
            filtered = filtered.filter(
              (p) =>
                String(p.category) === String(categoryId) ||
                (p.category_name && p.category_name.toLowerCase().includes(catName))
            );
          }
        }
        results = filtered;
        totalCount = filtered.length;
      }

      // Client-side quick filter adjustments if applied
      if (maxPriceFilter) {
        results = results.filter((p) => Number(p.price) <= Number(maxPriceFilter));
      }
      if (inStockOnly) {
        results = results.filter((p) => p.in_stock);
      }
      if (ratingFilter) {
        results = results.filter((p) => Number(p.rating) >= Number(ratingFilter));
      }

      // Sorting
      if (ordering === 'price') {
        results.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (ordering === '-price') {
        results.sort((a, b) => Number(b.price) - Number(a.price));
      } else if (ordering === '-rating') {
        results.sort((a, b) => Number(b.rating) - Number(a.rating));
      } else if (ordering === 'name') {
        results.sort((a, b) => a.name.localeCompare(b.name));
      }

      setProducts(results);
      setCount(totalCount);
    } catch (err) {
      if (err.response?.status === 404 && page > 1) {
        setPage(1);
      } else {
        setProducts(CURATED_PRODUCTS.slice(0, PAGE_SIZE));
        setCount(CURATED_PRODUCTS.length);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, ordering, maxPriceFilter, inStockOnly, ratingFilter, categories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast('Please sign in to add items to your cart.', 'warning');
      navigate('/signin', { state: { from: '/' } });
      return;
    }
    try {
      await addToCart(product.id, 1);
      toast(`Added “${product.name}” to your cart! 🛍️`, 'success');
    } catch (err) {
      toast(err?.response?.data?.detail || 'Could not add this item to your cart.', 'error');
    }
  };

  const handleCategoryClick = (catId) => {
    const params = new URLSearchParams();
    if (catId) params.set('category', catId);
    if (ordering) params.set('ordering', ordering);
    navigate(`/?${params.toString()}`);
  };

  const currentCategoryObj = categories.find((c) => String(c.id) === categoryId);
  const pageHeading = search
    ? `Search Results for “${search}”`
    : currentCategoryObj
      ? currentCategoryObj.name
      : 'All Curated Royal Collections & Gourmet Finds';

  return (
    <div className="ecommerce-home">
      {/* Category Strip (Meesho & Flipkart style circular icons) */}
      <nav className="mega-category-strip" aria-label="Shop Departments">
        <div className="mega-category-strip__inner">
          <button
            type="button"
            className={`cat-pill ${!categoryId ? 'cat-pill--active' : ''}`}
            onClick={() => handleCategoryClick('')}
          >
            <div className="cat-avatar-wrap">
              <span className="cat-avatar-icon"><i className="bi bi-grid-fill"></i></span>
            </div>
            <span className="cat-pill-name">All Departments</span>
          </button>

          {categories.map((cat) => {
            const avatar = CATEGORY_AVATARS[cat.name] || DEFAULT_AVATAR;
            const isActive = categoryId === String(cat.id);
            return (
              <button
                type="button"
                key={cat.id}
                className={`cat-pill ${isActive ? 'cat-pill--active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <div className="cat-avatar-wrap">
                  <img src={avatar} alt={cat.name} className="cat-avatar-img" loading="lazy" />
                </div>
                <span className="cat-pill-name">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Hero Carousel Banner Section */}
      {!search && !categoryId && (
        <section className="hero-carousel-section" aria-label="Featured Offers">
          <div className="hero-slider-wrap">
            {HERO_SLIDES.map((slide, idx) => (
              <div
                key={slide.id}
                className={`hero-slide ${idx === currentSlide ? 'hero-slide--active' : ''}`}
                style={{ background: slide.bg }}
              >
                <div className="hero-slide__inner">
                  <div className="hero-slide__text">
                    <span className="hero-tag-badge">
                      <i className="bi bi-stars"></i> {slide.tag}
                    </span>
                    <h1 className="hero-title">{slide.title}</h1>
                    <p className="hero-sub">{slide.sub}</p>
                    <div className="hero-action-row">
                      <button
                        type="button"
                        className="hero-cta-btn"
                        onClick={() => navigate(`/?search=${slide.categorySearch}`)}
                      >
                        <span>{slide.cta}</span>
                        <i className="bi bi-arrow-right"></i>
                      </button>
                      <span className="hero-perk-badge">
                        <i className="bi bi-shield-check"></i> {slide.badge}
                      </span>
                    </div>
                  </div>
                  <div className="hero-slide__img-box">
                    <img src={slide.image} alt={slide.title} className="hero-slide__img" />
                  </div>
                </div>
              </div>
            ))}

            {/* Slider Navigation Arrows */}
            <button
              type="button"
              className="slider-nav slider-nav--prev"
              onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
              aria-label="Previous Slide"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              type="button"
              className="slider-nav slider-nav--next"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
              aria-label="Next Slide"
            >
              <i className="bi bi-chevron-right"></i>
            </button>

            {/* Slider Dots */}
            <div className="slider-dots">
              {HERO_SLIDES.map((slide, idx) => (
                <button
                  type="button"
                  key={slide.id}
                  className={`slider-dot ${idx === currentSlide ? 'slider-dot--active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Flash Sale Banner & Countdown Strip */}
      {!search && !categoryId && (
        <section className="flash-sale-strip">
          <div className="flash-sale-left">
            <div className="flash-fire-icon">
              <i className="bi bi-gem"></i>
            </div>
            <div className="flash-title-block">
              <h3>👑 ROYAL PRIVILEGE DEALS OF THE DAY</h3>
              <p>Limited heirloom drops, organic gourmet harvests & studio electronics at privileged member prices.</p>
            </div>
          </div>

          <div className="flash-countdown-wrap">
            <span className="countdown-label">ENDS IN:</span>
            <div className="countdown-boxes">
              <span className="countdown-box">
                <strong>{String(timeLeft.hours).padStart(2, '0')}</strong>
                <small>HRS</small>
              </span>
              <span className="countdown-sep">:</span>
              <span className="countdown-box">
                <strong>{String(timeLeft.minutes).padStart(2, '0')}</strong>
                <small>MIN</small>
              </span>
              <span className="countdown-sep">:</span>
              <span className="countdown-box">
                <strong>{String(timeLeft.seconds).padStart(2, '0')}</strong>
                <small>SEC</small>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Main Catalog Section */}
      <main className="catalog-container">
        {/* Breadcrumb & Filter Bar */}
        <div className="catalog-header-bar">
          <div className="catalog-header-left">
            <span className="catalog-breadcrumb">
              <Link to="/">Home</Link>
              <i className="bi bi-chevron-right"></i>
              {categoryId ? (
                <span>{currentCategoryObj?.name || 'Category'}</span>
              ) : search ? (
                <span>Search: “{search}”</span>
              ) : (
                <span>All Products</span>
              )}
            </span>
            <h2 className="catalog-title">{pageHeading}</h2>
            {!loading && !error && (
              <span className="catalog-count-badge">
                {products.length} {products.length === 1 ? 'item' : 'items'} found
              </span>
            )}
          </div>

          {/* Sorting & Filter Controls */}
          <div className="catalog-header-right">
            <div className="filter-controls-group">
              {/* Quick Filter: In Stock */}
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span>In Stock Only</span>
              </label>

              {/* Price Filter dropdown */}
              <select
                className="filter-select-pro"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
                aria-label="Filter by Price"
              >
                <option value="">All Prices</option>
                <option value="500">Under ₹500</option>
                <option value="1000">Under ₹1,000</option>
                <option value="2000">Under ₹2,000</option>
                <option value="3000">Under ₹3,000</option>
              </select>

              {/* Rating filter dropdown */}
              <select
                className="filter-select-pro"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                aria-label="Filter by Rating"
              >
                <option value="">All Ratings</option>
                <option value="4.5">4.5★ & Above</option>
                <option value="4.0">4.0★ & Above</option>
              </select>

              {/* Sort by dropdown */}
              <select
                className="filter-select-pro filter-select-pro--sort"
                value={ordering}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams);
                  if (e.target.value) params.set('ordering', e.target.value);
                  else params.delete('ordering');
                  navigate(`/?${params.toString()}`);
                }}
                aria-label="Sort products"
              >
                <option value="">Sort: Featured</option>
                <option value="-rating">Sort: Top Rated</option>
                <option value="price">Sort: Price Low to High</option>
                <option value="-price">Sort: Price High to Low</option>
                <option value="name">Sort: Name A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips bar (if any active) */}
        {(search || categoryId || maxPriceFilter || inStockOnly || ratingFilter) && (
          <div className="active-chips-strip">
            <span className="chips-title">Active Filters:</span>
            {search && (
              <span className="filter-chip">
                Search: “{search}”
                <button type="button" onClick={() => navigate('/')}><i className="bi bi-x"></i></button>
              </span>
            )}
            {categoryId && currentCategoryObj && (
              <span className="filter-chip">
                Category: {currentCategoryObj.name}
                <button type="button" onClick={() => handleCategoryClick('')}><i className="bi bi-x"></i></button>
              </span>
            )}
            {maxPriceFilter && (
              <span className="filter-chip">
                Max Price: ₹{maxPriceFilter}
                <button type="button" onClick={() => setMaxPriceFilter('')}><i className="bi bi-x"></i></button>
              </span>
            )}
            {ratingFilter && (
              <span className="filter-chip">
                Rating: {ratingFilter}★+
                <button type="button" onClick={() => setRatingFilter('')}><i className="bi bi-x"></i></button>
              </span>
            )}
            {inStockOnly && (
              <span className="filter-chip">
                In Stock Only
                <button type="button" onClick={() => setInStockOnly(false)}><i className="bi bi-x"></i></button>
              </span>
            )}
            <button
              type="button"
              className="clear-all-chips-btn"
              onClick={() => {
                setMaxPriceFilter('');
                setInStockOnly(false);
                setRatingFilter('');
                navigate('/');
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Product Grid Area */}
        {loading ? (
          <div className="catalog-loading-state" role="status">
            <div className="spinner-grow text-primary me-2" role="status"></div>
            <span>Fetching the best deals for you…</span>
          </div>
        ) : error ? (
          <div className="catalog-message-card" role="alert">
            <i className="bi bi-cloud-slash text-danger"></i>
            <h3>We couldn’t reach the catalog</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadProducts}>Try Again</button>
          </div>
        ) : products.length === 0 ? (
          <div className="catalog-message-card">
            <i className="bi bi-search text-muted"></i>
            <h3>No products found matching your filters</h3>
            <p>Try clearing filters or search for something else like "saree", "watch", or "mouse".</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setMaxPriceFilter('');
                setInStockOnly(false);
                setRatingFilter('');
                navigate('/');
              }}
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="product-grid-pro">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && count > PAGE_SIZE && (
          <div className="catalog-pagination">
            <Pagination
              count={count}
              pageSize={PAGE_SIZE}
              currentPage={page}
              onPageChange={setPage}
            />
          </div>
        )}
      </main>

      {/* Real E-Commerce Assurance Feature Strip */}
      <section className="ecommerce-feature-banner">
        <div className="feature-banner-col">
          <div className="feature-banner-icon"><i className="bi bi-shield-check"></i></div>
          <div>
            <h4>100% Genuine Guarantee</h4>
            <p>Products sourced directly from verified authorized manufacturers.</p>
          </div>
        </div>
        <div className="feature-banner-col">
          <div className="feature-banner-icon"><i className="bi bi-currency-rupee"></i></div>
          <div>
            <h4>Lowest Price Promise</h4>
            <p>Unmatched value with direct manufacturer pricing and everyday coupons.</p>
          </div>
        </div>
        <div className="feature-banner-col">
          <div className="feature-banner-icon"><i className="bi bi-truck-flatbed"></i></div>
          <div>
            <h4>Safe & Insured Delivery</h4>
            <p>Sanitized multi-layer protective packaging right to your doorstep.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
