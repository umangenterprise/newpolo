import Navbar from "../components/Navbar.jsx";

const MainLayout = ({ children }) => (
  <div className="app-shell">
    <Navbar />
    <main>{children}</main>
    <footer className="footer">
      <div className="container">
        <p>Umang Bags - Crafted for everyday journeys.</p>
      </div>
    </footer>
  </div>
);

export default MainLayout;