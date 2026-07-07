import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { RequestsPage } from "../pages/RequestsPage";
import { NewBookingPage } from "../pages/NewBookingPage";
import { AvailabilityPage } from "../pages/AvailabilityPage";
import { UsersPage } from "../pages/UsersPage";
import { RoomsPage } from "../pages/RoomsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { canManageUsers } from "../lib/types";

export const router = createBrowserRouter(
  [
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <AppShell />,
          children: [
            { path: "/", element: <RequestsPage /> },
            { path: "/bookings/new", element: <NewBookingPage /> },
            { path: "/availability", element: <AvailabilityPage /> },
            {
              element: <ProtectedRoute allow={canManageUsers} />,
              children: [
                { path: "/users", element: <UsersPage /> },
                { path: "/rooms", element: <RoomsPage /> },
              ],
            },
          ],
        },
      ],
    },
    { path: "*", element: <NotFoundPage /> },
  ],
  // En GitHub Pages el sitio vive bajo /ReservasMob/, no en la raíz del
  // dominio; import.meta.env.BASE_URL ya trae ese prefijo en build (y "/" en
  // dev), así que las rutas del cliente coinciden con dónde se sirvieron.
  { basename: import.meta.env.BASE_URL },
);
