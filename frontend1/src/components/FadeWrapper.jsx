import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function FadeWrapper({ children }) {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      {children}
    </div>
  );
}