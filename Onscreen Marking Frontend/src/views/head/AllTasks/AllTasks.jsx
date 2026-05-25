import { getAllReviewerTasks } from "components/Helper/Head/HeadRoute";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import { styled } from "@mui/material/styles";
import TableRow from "@mui/material/TableRow";
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[800],
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));
const columns = [
  { id: "slno", label: "Sl No" },

  { id: "subjectCode", label: "Subject Code" },
  { id: "totalBooklets", label: "Total Booklets" },
  {
    id: "status",
    label: "Status",

    format: (value) => (value !== "active" ? "Not Started" : "Started"),
  },

  { id: "action", label: "Action" },
];
const Dashboard = () => {
  const [allTasks, setAllTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await getAllReviewerTasks();
        if (response?.data) {
          if (Array.isArray(response?.data)) {
            setAllTasks(response.data);
          }
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {});
  const handleStartTask = (rowData) => {
    console.log(rowData._id);
    navigate(`/headevaluator/task/${rowData._id}`);
    window.location.reload();
  };
  console.log(allTasks);
  const AssignedTasks = allTasks.map((row, index) => (
    <TableRow hover role="checkbox" tabIndex={-1} key={row._id}>
      {columns.map((column) => {
        let value;

        // Handle the Sl No column
        if (column.id === "slno") {
          value = index + 1;
        } else {
          value = row[column.id];
        }
        if (column.id === "action") {
          return (
            <TableCell key={column.id} align={column.align}>
              <button
                onClick={() => handleStartTask(row)}
                // data-hidden-value={row}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Start Task
              </button>
            </TableCell>
          );
        }
        return (
          <TableCell key={column.id} align={column.align}>
            {column.format && typeof value !== "undefined"
              ? column.format(value)
              : value}
          </TableCell>
        );
      })}
    </TableRow>
  ));

  return (
    <>
      <div className=" w-full justify-center rounded-lg border border-gray-200 bg-white p-4 text-center shadow dark:border-gray-700 dark:bg-gray-800 sm:p-8 ">
        <h5 className=" mb-10 text-3xl font-bold text-gray-900 dark:text-white">
          Allocated Tasks
        </h5>
        <p className="mb-5 text-base text-gray-500 dark:text-gray-400 sm:text-lg">
          Click Below to start evaluating the papers.
        </p>
        
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <StyledTableCell
                      key={column.id}
                      align={column.align}
                      style={{ minWidth: column.minWidth }}
                      sx={{
                        fontWeight: "bold",
                        fontFamily: "Roboto, Arial, sans-serif",
                        fontSize: "16px",
                      }}
                    >
                      {column.label}
                    </StyledTableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>{AssignedTasks}</TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
    </>
  );
};

export default Dashboard;
