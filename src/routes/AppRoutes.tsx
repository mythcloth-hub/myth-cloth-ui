import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import DistributorListPage from "../features/distributors/pages/DistributorListPage";
import DistributorFormPage from "../features/distributors/pages/DistributorFormPage";
import CatalogListPage from "../features/catalogs/pages/CatalogListPage";
import CatalogFormPage from "../features/catalogs/pages/CatalogFormPage";
import AnniversaryListPage from "../features/anniversaries/pages/AnniversaryListPage";
import AnniversaryFormPage from "../features/anniversaries/pages/AnniversaryFormPage";
import ChartsPage from "../features/charts/pages/ChartsPage";
import ReleasesPage from "../features/charts/pages/ReleasesPage";
import FigurineCollectionPage from "../features/figurines/pages/FigurineCollectionPage";
import FigurineDetailPage from "../features/figurines/pages/FigurineDetailPage";
import FigurineFormPage from "../features/figurines/pages/FigurineFormPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/figurines" />} />
          <Route path="/figurines" element={<FigurineCollectionPage />} />
          <Route path="/figurines/new" element={<FigurineFormPage />} />
          <Route path="/figurines/:id" element={<FigurineDetailPage />} />
          <Route path="/figurines/:id/edit" element={<FigurineFormPage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/releases" element={<ReleasesPage />} />
          <Route path="/distributors" element={<DistributorListPage />} />
          <Route path="/distributors/new" element={<DistributorFormPage />} />
          <Route path="/distributors/edit/:id" element={<DistributorFormPage />} />
          <Route path="/anniversaries" element={<AnniversaryListPage />} />
          <Route path="/anniversaries/new" element={<AnniversaryFormPage />} />
          <Route path="/anniversaries/edit/:id" element={<AnniversaryFormPage />} />
          <Route path="/catalogs/:catalogType" element={<CatalogListPage />} />
          <Route path="/catalogs/:catalogType/new" element={<CatalogFormPage />} />
          <Route path="/catalogs/:catalogType/edit/:id" element={<CatalogFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}