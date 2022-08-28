import React from "react";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { Route, useNavigate } from "react-router-dom";

function Login({ user }) {
  const navigate = useNavigate();
  console.log("Login");
  return (
    <React.Fragment>
      <h1>Test Welcome {user.username}!</h1>
      <button onClick={() => navigate("/")}>Go to blog page</button>
    </React.Fragment>
  );
}

export default withAuthenticator(Login);
