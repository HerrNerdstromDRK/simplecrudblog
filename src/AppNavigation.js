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
    <nav>
      <Link to="/"> Blog Home </Link>
      <Link to="/Login"> Login </Link>
    </nav>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="Login" element={<Login />} />
    </Routes>
  </Router>
);

export default AppNavigation;

/*
const Login = () => <Authenticator />;

const HeaderLinks = (authState) => (
  <ul>
    <li>
      <Link to="/">Home</Link>
    </li>
    <li>
      <Link to="/auth">Create Account/Login</Link>
    </li>
    <li>
      <Link to="/secret">Secret</Link>
    </li>
  </ul>
);

const AuthFunction = (authProps) => {
  console.log("AuthFunction> isLoggedIn: " + authProps.isLoggedIn);
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <h1>Hello {user.username}</h1>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
};

const doLogin = () => {
  console.log("doLogin");
  return (
    <Authenticator variation="modal">
      {" "}
      {({ signIn }) => <button onClick={signIn}>Sign in</button>}{" "}
    </Authenticator>
  );
};

const getLoginButton = () => {
  console.log("getLoginButton");
  return (
    <Button size="small" onClick={doLogin}>
      Sign In
    </Button>
  );
};

const getLogoutButton = () => {
  console.log("getLogoutButton");
  return (
    <Authenticator variation="modal">
      {({ signOut }) => <button onClick={signOut}>Sign out</button>}
    </Authenticator>
  );
};

const BlogHeader = ({ authState }) => {
  return (
    <>
      <center>
        <Heading level={1}>Yoda Blog</Heading>
        <Text>
          {authState.isLoggedIn
            ? "Welcome {user.username}!"
            : "Please login to create or update blog posts"}
        </Text>
        {authState.isLoggedIn ? getLogoutButton() : getLoginButton()}
      </center>
    </>
  );
};

class AuthComponent extends Component {
  handleStateChange = (state) => {
    console.log("AuthComponent.handleStateChange> state: " + state);
    if (state === "signedIn") {
      this.props.onUserSignIn();
    }
  };
  render() {
    console.log("AuthComponent.render");
    return (
      <div>
        <Authenticator onStateChange={this.handleStateChange} />
      </div>
    );
  }
}

const ProtectedRoute = (props) => (
  <Route
    exact={props.exact}
    path={props.path}
    render={(rProps) =>
      props.props.isLoggedIn ? (
        <props.render exact={props.exact} />
      ) : (
        <Navigate
          to={`/auth?redirect=${props.location.pathname}${props.location.search}`}
        />
      )
    }
  />
);

const MyRoutes = ({ authState }) => {
  console.log("MyRoutes> authState: " + authState);
  return (
    <Routes>
      <Route exact path="/Home" element={<Home />} props={authState} />
      <Route exact path="/auth" element={<AuthComponent />} props={authState} />
    </Routes>
  );
};

class App extends Component {
  state = {
    authState: {
      isLoggedIn: false,
    },
  };
  handleUserSignIn = () => {
    console.log("App.handleUserSignIn");
    this.setState({ authState: { isLoggedIn: true } });
  };
  render() {
    console.log("App.render");

    return (
      <div className="App">
        <h1> Amplify Routes Example</h1>
        <HeaderLinks authState={this.state.authState} />
        <MyRoutes authState={this.state.authState} />
      </div>
    );
  }
}
*/

/*
function App() {
  const { route } = useAuthenticator((context) => [context.route]);
  return <Home />;
  //  return route === "authenticated" ? <Home /> : <Login />;
}

export default function AppNavigation() {
  return (
    <Authenticator.Provider>
      <App></App>
    </Authenticator.Provider>
  );
}
*/
