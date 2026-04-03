import { useEffect, useState } from "react";
import { FiMenu, FiMoon, FiSearch, FiShoppingBag, FiSun, FiUser, FiX } from "react-icons/fi";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const savedTheme = window.localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const Navbar = () => {
  const { cartCount, logout, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(getInitialTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

  const handleSearch = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("query");
    navigate(`/products?q=${encodeURIComponent(query || "")}`);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to={user ? "/" : "/auth"} className="logo">
          Umang
        </Link>

        <button
          type="button"
          className="icon-btn mobile-menu-toggle"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>

        <nav className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
          {user && <NavLink to="/">Home</NavLink>}
          {user && <NavLink to="/products">Shop</NavLink>}
          {user && <NavLink to="/checkout">Address</NavLink>}
          {user && <NavLink to="/profile#orders">Orders</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin">Seller Panel</NavLink>}
        </nav>

        <form className={`search ${mobileMenuOpen ? "mobile-open" : ""}`} onSubmit={handleSearch}>
          <FiSearch />
          <input type="text" name="query" placeholder={user ? "Search bags" : "Login to continue"} />
        </form>

        <div className={`nav-actions ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <button
            type="button"
            className={`icon-btn theme-toggle ${theme === "dark" ? "active" : ""}`}
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
          <Link to="/cart" className="icon-btn" aria-label="cart">
            <FiShoppingBag />
            {cartCount > 0 && <span>{cartCount}</span>}
          </Link>
          <Link to={user ? "/profile" : "/auth"} className="icon-btn" aria-label="profile">
            <FiUser />
          </Link>
          {user && (
            <button className="text-btn" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
