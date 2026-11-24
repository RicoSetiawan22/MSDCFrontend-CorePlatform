import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { router } from "./app/router";
import { AuthProvider } from "@shared/lib/auth-context";
import { OrganizationProvider } from "@shared/lib/organization-context";
import { queryClient } from "@shared/lib/query-client";
import "@shared/styles/global.css";

// OrganizationProvider harus di dalam AuthProvider (setelah login, user.organization sudah terisi).
// OrganizationProvider juga di dalam RouterProvider sehingga TopBar (bagian AppLayout
// yang dirender sebagai route anak) bisa pakai useOrganization().
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <RouterProvider router={router} />
        </OrganizationProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
