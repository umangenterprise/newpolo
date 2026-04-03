import { motion } from "framer-motion";

const Loader = ({ text = "Loading Umang..." }) => (
  <div className="loader-wrap">
    <motion.div
      className="loader-dot"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ repeat: Infinity, duration: 1.2 }}
    />
    <p>{text}</p>
  </div>
);

export default Loader;