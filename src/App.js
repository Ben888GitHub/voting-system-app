import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { CharacterList } from "./components";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";

function App() {
  return (
    <div className="App">
      <Switch>
        <Route path="/:charId" component={CharacterList} />
        <Route path="/" exact component={CharacterList} />
      </Switch>
    </div>
  );
}

export default App;
