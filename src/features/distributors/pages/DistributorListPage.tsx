import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { Button, Box, Typography, Tooltip } from "@mui/material";
import {
  getAllDistributors,
  deleteDistributor,
} from "../api/distributorApi";
import type { Distributor } from "../types/distributor";

const countryCodeToFlag = (code: string) =>
  code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");

export default function DistributorListPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const data = await getAllDistributors();
      setDistributors(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load distributors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this distributor?");
    if (!confirmed) return;

    try {
      await deleteDistributor(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete distributor");
    }
  };

  const columns: GridColDef[] = [
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      valueGetter: (_value, row) => row.description || "-",
    },
    {
      field: "countryCode",
      headerName: "Country",
      width: 100,
      renderCell: (params) =>
        params.value ? (
          <Tooltip title={params.value}>
            <span style={{ fontSize: "1.5rem" }}>
              {countryCodeToFlag(params.value)}
            </span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      field: "website",
      headerName: "Website",
      flex: 1,
      renderCell: (params) =>
        params.value ? (
          <a
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit
          </a>
        ) : (
          "-"
        ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <>
          <Button
            size="small"
            onClick={() =>
              navigate(`/distributors/edit/${params.row.id}`)
            }
          >
            Edit
          </Button>

          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Distributors
      </Typography>

      <Button
        variant="contained"
        sx={{ marginBottom: 2 }}
        onClick={() => navigate("/distributors/new")}
      >
        + Add Distributor
      </Button>

      <div style={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={distributors}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 20, 30]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </div>
    </Box>
  );
}