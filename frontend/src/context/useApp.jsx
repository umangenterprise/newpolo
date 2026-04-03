import { useContext } from "react";
import { AppContext } from "./appContextObject.jsx";

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
};
