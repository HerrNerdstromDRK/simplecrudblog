import { Amplify } from "aws-amplify";
import React, { Component } from "react";
import {
  Link,
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import { Authenticator, Heading, Text, Button } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import awsExports from "./aws-exports";
import Home from "./Home";
import Login from "./Login";

Amplify.configure(awsExports);

const AppNavigation = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="Login" element={<Login />} />
    </Routes>
  </Router>
);

export default AppNavigation;
