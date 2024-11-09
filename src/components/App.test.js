// src/components/App.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

test("renders Outlet component", () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );

  // Assuming that the Outlet will render some text content.
  // Replace 'Some text content' with the actual text you expect in the Outlet
  const outletContent = screen.getByText(/Some text content/i);
  expect(outletContent).toBeInTheDocument();
});
