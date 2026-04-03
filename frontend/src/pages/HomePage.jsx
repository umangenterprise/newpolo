import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { useApp } from "../context/useApp.jsx";

void motion;

const heroOffers = [
  {
    eyebrow: "Featured Drop",
    title: "Urban Carry Series",
    text: "Designed for style + utility",
  },
  {
    eyebrow: "Limited Time Offer",
    title: "Travel Ready Backpacks",
    text: "Up to 25% off on daily carry essentials",
  },
  {
    eyebrow: "New Arrival",
    title: "Street Sling Edit",
    text: "Compact fits with a bold everyday look",
  },
];

const HomePage = () => {
  const { products } = useApp();
  const featured = products.filter((item) => item.featured).slice(0, 6);
  const [activeOffer, setActiveOffer] = useState(0);

  useEffect(() => {
    const slider = window.setInterval(() => {
      setActiveOffer((current) => (current + 1) % heroOffers.length);
    }, 3200);

    return () => window.clearInterval(slider);
  }, []);

  return (
    <div>
      <section className="hero-section">
        <div className="container hero-grid">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="overline">Modern. Minimal. Everyday.</p>
            <h1>Umang Bags</h1>
            <p>
              Premium sling bags, backpacks, and handbags crafted for youth, travel,
              and daily hustle.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="primary-btn">
                Shop Collection
              </Link>
              <Link to="/products?category=backpack" className="ghost-btn">
                Explore Backpacks
              </Link>
            </div>
          </motion.div>
          <motion.div className="hero-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="hero-card-top">
              <span className="hero-card-badge">Auto Offers</span>
              <div className="hero-progress">
                {heroOffers.map((offer, index) => (
                  <button
                    key={offer.title}
                    type="button"
                    className={`hero-progress-dot ${index === activeOffer ? "active" : ""}`}
                    onClick={() => setActiveOffer(index)}
                    aria-label={`Show offer ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={heroOffers[activeOffer].title}
                className="hero-offer-content"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <p>{heroOffers[activeOffer].eyebrow}</p>
                <h3>{heroOffers[activeOffer].title}</h3>
                <span>{heroOffers[activeOffer].text}</span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <section className="container section-gap">
        <div className="section-head">
          <h2>Featured Bags</h2>
          <Link to="/products">View all</Link>
        </div>

        <div className="products-grid">
          {featured.map((item) => (
            <ProductCard key={item._id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
