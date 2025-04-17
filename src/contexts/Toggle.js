// src/contexts/Toggle.js
import React, { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const ToggleContext = createContext();

export const ToggleProvider = ({ children }) => {
  const [subtitles, setSubtitles] = useState(false);
  const [signLanguage, setSignLanguage] = useState(false);

  return (
    <ToggleContext.Provider
      value={{ subtitles, setSubtitles, signLanguage, setSignLanguage }}
    >
      {children}
    </ToggleContext.Provider>
  );
};

ToggleProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useToggleContext = () => useContext(ToggleContext);
