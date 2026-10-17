import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import ProtectedRoute from "./components/ProtectedRoute";

const Account = lazy(() => import("./pages/Account"));
const Admin = lazy(() => import("./pages/Admin"));
const AuthAction = lazy(() => import("./pages/AuthAction"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Messages = lazy(() => import("./pages/Messages"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Publish = lazy(() => import("./pages/Publish"));
const Questions = lazy(() => import("./pages/Questions"));
const Simulations = lazy(() => import("./pages/Simulations"));
const SimulationIndex = lazy(() =>
  import("./pages/Simulations").then((module) => ({
    default: module.SimulationIndex,
  })),
);
const SimulationViewer = lazy(() =>
  import("./pages/Simulations").then((module) => ({
    default: module.SimulationViewer,
  })),
);

function RouteFallback() {
  return (
    <div className="grid min-h-[65vh] place-items-center font-mono text-[9px] tracking-[1.5px] text-neutral-500">
      LOCATING SIGNAL...
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="auth/action" element={<AuthAction />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="publish"
            element={
              <ProtectedRoute>
                <Publish />
              </ProtectedRoute>
            }
          />
          <Route path="simulations" element={<Simulations />}>
            <Route index element={<SimulationIndex />} />
            <Route path=":simulationId" element={<SimulationViewer />} />
          </Route>
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute adminOnly>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="profile/:userId" element={<PublicProfile />} />
          <Route
            path="messages/:userId?"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route path="questions" element={<Questions />} />
          <Route
            path="*"
            element={
              <ComingSoon
                section="404 / OFF ORBIT"
                title="A little beyond our coordinates."
                description="This page doesn't exist. Let's find our way home."
              />
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
