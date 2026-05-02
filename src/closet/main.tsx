import React from "react";
import { createRoot } from "react-dom/client";
import "../styles/globals.css";
import { Closet } from "./Closet";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Closet />
  </React.StrictMode>
);
