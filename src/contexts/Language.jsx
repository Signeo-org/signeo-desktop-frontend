// src/contexts/Language.js
import React, { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const LanguageContext = createContext();

export const languages = [
  "LSE SPAIN",
  "ASL USA",
  "BSL UK",
  "LSF FRANCE",
  "ISL INDIA",
];

export const LanguageProvider = ({ children }) => {
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);

  return (
    <LanguageContext.Provider
      value={{ currentLanguageIndex, setCurrentLanguageIndex }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLanguageContext = () => useContext(LanguageContext);
