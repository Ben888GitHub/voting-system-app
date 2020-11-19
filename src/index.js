import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById("root")
);

{
  /* <React.StrictMode></React.StrictMode> */
}
