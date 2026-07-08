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
import PricingPage from "../features/charts/pages/PricingPage";
import FigurineCollectionPage from "../features/figurines/pages/FigurineCollectionPage";
import FigurineDetailPage from "../features/figurines/pages/FigurineDetailPage";
import FigurineFormPage from "../features/figurines/pages/FigurineFormPage";
import CollectionsListPage from "../features/collections/pages/CollectionsListPage";
import CollectionDetailPage from "../features/collections/pages/CollectionDetailPage";
import PurchasesPage from "../features/purchases/pages/PurchasesPage";
import RoleListPage from "../features/security/pages/RoleListPage";
import RoleFormPage from "../features/security/pages/RoleFormPage";
import PermissionListPage from "../features/security/pages/PermissionListPage";
import PermissionFormPage from "../features/security/pages/PermissionFormPage";
import RolePermissionsPage from "../features/security/pages/RolePermissionsPage";
import FigurineLoaderPage from "../features/security/pages/FigurineLoaderPage";

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
          <Route path="/collections" element={<CollectionsListPage />} />
          <Route path="/collections/:id" element={<CollectionDetailPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/releases" element={<ReleasesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/distributors" element={<DistributorListPage />} />
          <Route path="/distributors/new" element={<DistributorFormPage />} />
          <Route path="/distributors/edit/:id" element={<DistributorFormPage />} />
          <Route path="/anniversaries" element={<AnniversaryListPage />} />
          <Route path="/anniversaries/new" element={<AnniversaryFormPage />} />
          <Route path="/anniversaries/edit/:id" element={<AnniversaryFormPage />} />
          <Route path="/catalogs/:catalogType" element={<CatalogListPage />} />
          <Route path="/catalogs/:catalogType/new" element={<CatalogFormPage />} />
          <Route path="/catalogs/:catalogType/edit/:id" element={<CatalogFormPage />} />
          <Route path="/security/roles" element={<RoleListPage />} />
          <Route path="/security/roles/new" element={<RoleFormPage />} />
          <Route path="/security/roles/edit/:id" element={<RoleFormPage />} />
          <Route path="/security/permissions" element={<PermissionListPage />} />
          <Route path="/security/permissions/new" element={<PermissionFormPage />} />
          <Route path="/security/permissions/edit/:id" element={<PermissionFormPage />} />
          <Route path="/security/role-permissions" element={<RolePermissionsPage />} />
          <Route path="/security/figurines/load" element={<FigurineLoaderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}