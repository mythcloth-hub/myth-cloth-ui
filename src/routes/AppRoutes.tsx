import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DistributorListPage from "../features/distributors/pages/DistributorListPage";
import DistributorFormPage from "../features/distributors/pages/DistributorFormPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/distributors" />} />
        <Route path="/distributors" element={<DistributorListPage />} />
        <Route path="/distributors/new" element={<DistributorFormPage />} />
        <Route path="/distributors/edit/:id" element={<DistributorFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}