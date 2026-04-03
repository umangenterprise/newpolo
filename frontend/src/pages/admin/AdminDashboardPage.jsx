import { useEffect, useState } from "react";
import {
  FiBox,
  FiCalendar,
  FiPackage,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers
} from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../api/apiClient";
import Loader from "../../components/Loader.jsx";
import { formatCurrency } from "../../utils/helpers.js";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/admin/dashboard");
      setStats(data);
    };

    load();
  }, []);

  if (!stats)
    return (
      <section className="container section-gap">
        <Loader text="Loading dashboard..." />
      </section>
    );

  return (
    <section className="container section-gap">
      <div className="admin-hero">
        <div>
          <p className="admin-kicker">Control Center</p>
          <h2>Seller Panel Dashboard</h2>
          <p className="helper-text">Track orders, inventory and daily momentum in one place.</p>
        </div>
        <div className="admin-hero-summary">
          <span>Today</span>
          <strong>{stats.ordersToday ?? 0} orders</strong>
          <small>{formatCurrency(stats.revenue)} received revenue</small>
        </div>
      </div>

      <div className="admin-stats">
        <Link to="/admin/users" className="admin-stat-link tone-peach">
          <article>
            <span className="admin-stat-icon"><FiUsers /></span>
            <p>Users</p>
            <h3>{stats.usersCount}</h3>
          </article>
        </Link>
        <Link to="/admin/products" className="admin-stat-link tone-sand">
          <article>
            <span className="admin-stat-icon"><FiBox /></span>
            <p>Products</p>
            <h3>{stats.productsCount}</h3>
          </article>
        </Link>
        <Link to="/admin/orders" className="admin-stat-link tone-blue">
          <article>
            <span className="admin-stat-icon"><FiShoppingBag /></span>
            <p>Orders</p>
            <h3>{stats.ordersCount}</h3>
          </article>
        </Link>
        <Link to="/admin/orders" className="admin-stat-link tone-mint">
          <article>
            <span className="admin-stat-icon" aria-hidden="true">₹</span>
            <p>Revenue</p>
            <h3>{formatCurrency(stats.revenue)}</h3>
            <small className="admin-stat-subtext">
              Pending: {formatCurrency(stats.pendingRevenue || 0)}
            </small>
          </article>
        </Link>
        <Link to="/admin/orders" className="admin-stat-link tone-amber">
          <article>
            <span className="admin-stat-icon"><FiCalendar /></span>
            <p>Orders Today</p>
            <h3>{stats.ordersToday ?? 0}</h3>
          </article>
        </Link>
        <Link to="/admin/orders" className="admin-stat-link tone-violet">
          <article>
            <span className="admin-stat-icon"><FiTrendingUp /></span>
            <p>Last 7 Days</p>
            <h3>{stats.ordersLast7Days ?? 0}</h3>
          </article>
        </Link>
        <Link to="/admin/orders" className="admin-stat-link tone-coral">
          <article>
            <span className="admin-stat-icon"><FiPackage /></span>
            <p>This Month</p>
            <h3>{stats.ordersThisMonth ?? 0}</h3>
          </article>
        </Link>
      </div>

      <div className="admin-quick-links admin-actions">
        <Link to="/admin/products" className="ghost-btn admin-action-btn">
          Manage Products
        </Link>
        <Link to="/admin/orders" className="ghost-btn admin-action-btn">
          Customer Orders
        </Link>
      </div>
    </section>
  );
};

export default AdminDashboardPage;
