import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <section className="container section-gap auth-wrap">
    <div className="auth-card">
      <h2>Page not found</h2>
      <Link to="/" className="primary-btn">
        Go home
      </Link>
    </div>
  </section>
);

export default NotFoundPage;