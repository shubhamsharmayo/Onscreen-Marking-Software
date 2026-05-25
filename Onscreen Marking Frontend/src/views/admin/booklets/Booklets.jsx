import React, { useEffect, useState, useRef } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { FcProcess } from "react-icons/fc";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { MdTask } from "react-icons/md";
import { BsFileEarmarkCodeFill } from "react-icons/bs";
import { FaCloudUploadAlt } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";

import { FaCloudDownloadAlt } from "react-icons/fa";
import AssignBookletModal from "../../../components/modal/AssignBookletModal";
import AssignModalComp from "../../../components/modal/AssignModelComp";
import TestingQA from "../../../components/modal/TestingQA";
import { toast } from "react-toastify";
import axios from "axios";
import { getAllUsers } from "services/common";
import socket from "../../../services/socket/socket";
import Tooltip from "@mui/material/Tooltip";

// Initialize socket connection
// const socket = io(process.env.REACT_APP_API_URL, {
//   transports: ["websocket"], // Force WebSocket only for stability
//   reconnectionAttempts: 5,
//   timeout: 20000,
// });

const TwoLineHeader = ({ title }) => {
  const words = title.split(" ");

  return (
    <div
      style={{
        textAlign: "center",
        whiteSpace: "normal",
        lineHeight: "1.1",
        fontWeight: 700,
      }}
    >
      {words.length > 1 ? (
        <>
          <div>{words[0]}</div>
          <div>{words.slice(1).join(" ")}</div>
        </>
      ) : (
        <div>{title}</div>
      )}
    </div>
  );
};

const Booklets = () => {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAssignBookletModal, setShowAssignBookletModal] = useState(false);
  const [currentBookletDetails, setCurrentBookletDetails] = useState("");
  const [assignModel, setassignModel] = useState(false);
  const [qatestingModel, setQATestingModel] = useState(false);
  const [assignTask, setAssignTask] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState("single"); // single | range | all
  const [range, setRange] = useState({ from: "", to: "" });
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);
  console.log(showAssignBookletModal);

  useEffect(() => {
    // Check if the `dark` mode is applied to the `html` element
    const htmlElement = document.body; // `html` element
    const checkDarkMode = () => {
      const isDark = htmlElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Initial check
    checkDarkMode();

    // Optionally, observe for changes if the theme might toggle dynamically
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // useEffect(() => {
  //   const fetchTasksBySubjectCode = async () => {
  //     try {
  //       const response = await axios.get(
  //         `${process.env.REACT_APP_API_URL}/api/tasks/subjectcode?subjectcode=${currentBookletDetails?.folderName}`
  //       );
  //       console.log("booklet", response.data); // Handle the response data
  //       setAssignTask(response?.data);
  //     } catch (error) {
  //       console.error("Error fetching tasks:", error); // Handle errors
  //     }
  //   };

  //   // Usage
  //   if (currentBookletDetails) {
  //     fetchTasksBySubjectCode();
  //   }
  // }, [currentBookletDetails]);

  useEffect(() => {
    const fetchTasksBySubjectCode = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/tasks/subjectcode?subjectcode=${currentBookletDetails?.folderName}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Task data:", response.data);

        setAssignTask(response?.data || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to fetch task data");
      }
    };

    if (currentBookletDetails?.folderName) {
      fetchTasksBySubjectCode();
    }
  }, [currentBookletDetails]);

  console.log("Abhi Tests", currentBookletDetails);

  useEffect(() => {
    const handleFolderList = (folderList) => {
      // console.log("Initial folder list:", folderList);
      setRows(folderList?.map((folder) => ({ ...folder, id: folder?._id })));
      console.log(
        folderList?.map((folder) => ({ ...folder, id: folder?._id }))
      );
    };

    // const handleFolderUpdate = (updatedFolder) => {
    //   console.log("Folder updated:", updatedFolder);
    //   setRows((prevFolders) =>
    //     prevFolders.map((folder) =>
    //       folder._id === updatedFolder._id
    //         ? { ...updatedFolder, id: updatedFolder._id }
    //         : folder
    //     )
    //   );
    // };

    const handleFolderUpdate = (updatedFolder) => {
      console.log("Folder updated:", updatedFolder);

      setRows((prevFolders) =>
        prevFolders.map((folder) => {
          if (folder._id === updatedFolder._id) {
            return {
              ...folder, // keep old subjectName, className etc
              ...updatedFolder, // update only changed fields
              id: folder._id,
            };
          }
          return folder;
        })
      );
    };

    // const handleFolderAdd = (newFolder) => {
    //   // console.log("New folder added:", newFolder);
    //   setRows((prevFolders) => [
    //     ...prevFolders,
    //     { ...newFolder, id: newFolder._id },
    //   ]);
    // };

    const handleFolderAdd = (newFolder) => {
      setRows((prevFolders) => {
        const exists = prevFolders.find((f) => f._id === newFolder._id);

        if (exists) {
          return prevFolders.map((folder) =>
            folder._id === newFolder._id
              ? { ...folder, ...newFolder, id: folder._id }
              : folder
          );
        }

        return [...prevFolders, { ...newFolder, id: newFolder._id }];
      });
    };

    const handleFolderRemove = ({ folderName }) => {
      // console.log("Folder removed:", folderName);
      setRows((prevFolders) =>
        prevFolders?.filter((folder) => folder?.folderName !== folderName)
      );
    };

    // if (!socket.connected) socket.connect();

    // socket.on("connect", () => {
    //   console.log("Socket connected");
    //   socket.emit("request-folder-list");
    // });

    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit("request-folder-list");
    }

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("request-folder-list");
    });

    // Attach event listeners for real-time updates
    socket.on("folder-list", handleFolderList);
    socket.on("folder-update", handleFolderUpdate);
    socket.on("folder-add", handleFolderAdd);
    socket.on("folder-remove", handleFolderRemove);

    return () => {
      // Disconnect the socket and cleanup listeners

      socket.off("folder-list", handleFolderList);
      socket.off("folder-update", handleFolderUpdate);
      socket.off("folder-add", handleFolderAdd);
      socket.off("folder-remove", handleFolderRemove);
      socket.disconnect();
    };
  }, []);

  console.log(rows);

  const downloadCompletedBooklets = async (subjectCode) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/resultgeneration/download-completed-booklets/${subjectCode}`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.size === 0) {
        toast.error("No data available to download");
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${subjectCode}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error("Failed to download booklets");
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const subjectCode = currentBookletDetails?.folderName;

    const BATCH_SIZE = 1; // 🔥 adjust (3–5 best)

    // 🔹 helper to split into batches
    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const batches = chunkArray(files, BATCH_SIZE);

    try {
      for (const batch of batches) {
        /* ===============================
         ✅ NODE API (per batch)
      =============================== */
        const nodeForm = new FormData();

        batch.forEach((file) => {
          nodeForm.append("file", file);
        });

        nodeForm.append("subjectCode", subjectCode);

        const nodeRequest = axios.post(
          `${process.env.REACT_APP_API_URL}/api/bookletprocessing/uploadingbooklets`,
          nodeForm,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        /* ===============================
         ✅ .NET API (parallel per batch)
      =============================== */
        /* ===============================
   ✅ .NET API (parallel per batch)
================================= */
        const dotnetRequests = batch
          .filter((file) => file.type === "application/pdf")
          .map(async (file) => {
            try {
              /* =====================================
         1️⃣ GET LIMIT VALUE
      ===================================== */
              const limitResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/tasks/subjectcode?subjectcode=${subjectCode}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              // example response => 26
              const limit = limitResponse?.data;

              /* =====================================
         2️⃣ CREATE FORM DATA
      ===================================== */
              const form = new FormData();
              form.append("file", file);

              /* =====================================
         3️⃣ HIT .NET API
      ===================================== */
              const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}api/OmrProcessing/ExtractFils?SubjectId=${subjectCode}&limit=${limit}`,
                form,
                {
                  headers: {
                    accept: "*/*",
                    "Content-Type": "multipart/form-data",
                  },
                }
              );

              console.log("DOTNET RESPONSE:", response.data);

              return response.data;
            } catch (error) {
              console.error("DOTNET API ERROR:", error);
            }
          });

        /* ===============================
         🚀 RUN BATCH
      =============================== */
        await Promise.all([nodeRequest, ...dotnetRequests]);
      }

      toast.success("All batches uploaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await getAllUsers();
        setAllUsers(response || []);
      } catch (error) {
        console.error("Error fetching tasks:", error); // Handle errors
      }
    };
    fetchAllUsers();
  }, []);

  // console.log(allUsers)

  // console.log(assignTask)

  const resetDeleteState = () => {
    setShowDeleteModal(false);
    setRange({ from: "", to: "" });
  };

  const darkTheme = createTheme({
    palette: {
      mode: "dark", // Use 'light' for light mode
      background: {
        default: "#111c44", // Background for dark mode
      },
      text: {
        primary: "#ffffff", // White text for dark mode
      },
    },
  });

  const handleDelete = async () => {
    try {
      let from = Number(range.from);
      let to = Number(range.to);

      if (!from || !to) {
        toast.error("Please enter valid range");
        return;
      }

      if (from > to) {
        toast.error("From cannot be greater than To");
        return;
      }

      if (String(to).length > 6) {
        toast.error("Invalid booklet number");
        return;
      }

      const payload = {
        subjectCode: String(currentBookletDetails.folderName),
        from,
        to,
      };

      console.log("FINAL PAYLOAD:", payload);

      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/bookletprocessing/delete-booklets-range`,
        {
          data: payload,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Deleted successfully");
      resetDeleteState();
    } catch (err) {
      console.error("DELETE ERROR:", err);
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const columns = [
    // 🔽 First 3 columns – smaller

    {
      field: "subjectName", // make sure this matches backend key
      headerName: "Subject Name",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Subject Name" />,
    },
    {
      field: "folderName",
      headerName: "Subject Code",
      flex: 1,
      minWidth: 1 / 2,
      renderHeader: () => <TwoLineHeader title="Subject Code" />,
    },
    {
      field: "className",
      headerName: "Class",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Class" />,
    },
    {
      field: "scannedFolder",
      headerName: "Scanned Data",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Scanned Data" />,
    },

    // Normal size
    {
      field: "unAllocated",
      headerName: "Unallocated",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Unallocated" />,
    },
    {
      field: "allocated",
      headerName: "Allocated",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Allocated" />,
    },
    {
      field: "evaluated",
      headerName: "Evaluated",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Evaluated" />,
    },

    // 🔼 Bigger
    {
      field: "evaluation_pending",
      headerName: "Evaluation Pending",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Evaluation Pending" />,
    },

    {
      field: "upload",
      headerName: "Upload",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Upload" />,
      renderCell: (params) => (
        <>
          <Tooltip title="Upload the zip file" arrow placement="top">
            <div
              className="flex cursor-pointer justify-center rounded px-3 py-2"
              onClick={() => {
                setCurrentBookletDetails(params.row);
                fileInputRef.current.click();
              }}
            >
              <FaCloudUploadAlt className="size-7 text-yellow-600" />
            </div>
          </Tooltip>

          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.zip"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </>
      ),
    },

    // 🔼 Bigger
    {
      field: "processBooklets",
      headerName: "Process Booklets",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Process Booklets" />,
      renderCell: (params) => (
        <Tooltip title="Process the booklets" arrow placement="top">
          <div
            className="flex cursor-pointer justify-center rounded px-3 py-2"
            onClick={() => {
              localStorage.removeItem("navigateFrom");
              navigate(`/admin/process/booklets/${params.row.folderName}`);
            }}
          >
            <FcProcess className="size-7 text-indigo-500" />
          </div>
        </Tooltip>
      ),
    },

    {
      field: "assignTask",
      headerName: "Assign Task",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Assign Task" />,
      renderCell: (params) => (
        <Tooltip title="Assign the task to operator" arrow placement="top">
          <div
            className="flex cursor-pointer justify-center rounded px-3 py-2"
            onClick={() => {
              setassignModel(true);
              setCurrentBookletDetails(params.row);
            }}
          >
            <MdTask className="size-7 text-yellow-600" />
          </div>
        </Tooltip>
      ),
    },

    {
      field: "qatesting",
      headerName: "QA Testing ",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="QA Testing " />,
      renderCell: (params) => (
        <Tooltip title="Assign the task to operator" arrow placement="top">
          <div
            className="flex cursor-pointer justify-center rounded px-3 py-2"
            onClick={() => {
              setQATestingModel(true);
              setCurrentBookletDetails(params.row);
            }}
          >
            <BsFileEarmarkCodeFill className="size-7 text-yellow-600" />
          </div>
        </Tooltip>
      ),
    },

    // {
    //   field: "downloadbooklet",
    //   headerName: "Download Booklets",
    //   flex: 1,
    //   minWidth: 1,
    //   renderHeader: () => <TwoLineHeader title="Download Booklets" />,
    //   renderCell: (params) => (
    //     <Tooltip title="Download Booklets" arrow placement="top">
    //       <div
    //         className="flex cursor-pointer justify-center rounded px-3 py-2"
    //         onClick={() => {
    //           setShowAssignBookletModal(true);
    //           setCurrentBookletDetails(params.row);
    //         }}
    //       >
    //         <FaCloudDownloadAlt className="size-7 text-yellow-600" />
    //       </div>
    //     </Tooltip>
    //   ),
    // },

    {
      field: "downloadbooklet",
      headerName: "Download Booklets",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Download Booklets" />,
      renderCell: (params) => (
        <Tooltip title="Download Booklets" arrow placement="top">
          <div
            className="flex cursor-pointer justify-center rounded px-3 py-2"
            onClick={() => downloadCompletedBooklets(params.row.folderName)}
          >
            <FaCloudDownloadAlt className="size-7 text-yellow-600" />
          </div>
        </Tooltip>
      ),
    },
    {
      field: "deletebooklet",
      headerName: "Delete Booklets",
      flex: 1,
      minWidth: 1,
      renderHeader: () => <TwoLineHeader title="Delete Booklets" />,
      renderCell: (params) => (
        <Tooltip title="Download Booklets" arrow placement="top">
          <div
            className="flex cursor-pointer justify-center rounded px-3 py-2"
            onClick={() => {
              setCurrentBookletDetails(params.row);
              setRange({ from: "", to: "" });
              setShowDeleteModal(true);
            }}
          >
            <FaTrash className="mt-1 size-6 text-red-600" />
          </div>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="ml-6 mt-12">
      {isDarkMode ? (
        <ThemeProvider theme={darkTheme}>
          <div style={{ height: "600px", width: "98%" }}>
            <DataGrid
              className="dark:bg-navy-700"
              columns={columns}
              rows={rows}
              slots={{ toolbar: GridToolbar }}
              sx={{
                "& .MuiDataGrid-columnHeaders": {
                  fontWeight: 1000,
                  fontSize: "0.8rem",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                },
                "& .MuiDataGrid-cell": {
                  fontSize: "0.75rem",
                  color: "#ffffff",
                  display: "flex",
                  justifyContent: "center",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
                "& .MuiTablePagination-root": {
                  color: "#ffffff",
                },
                "& .MuiDataGrid-footerContainer": {
                  backgroundColor: "#111c44",
                  color: "#ffffff",
                },
                "& .MuiDataGrid-toolbarContainer button": {
                  color: "#ffffff",
                },
                "& .MuiDataGrid-toolbarContainer svg": {
                  fill: "#ffffff",
                },
              }}
            />
          </div>
        </ThemeProvider>
      ) : (
        <div
          style={{ maxHeight: "600px", width: "95%" }}
          className="dark:bg-navy-700"
        >
          <DataGrid
            columns={columns}
            rows={rows}
            slots={{ toolbar: GridToolbar }}
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                fontWeight: 1000,
                fontSize: "0.8rem",
                backgroundColor: "#ffffff",
                borderBottom: "1px solid rgba(0, 0, 0, 0.2)",
              },
              "& .MuiTablePagination-root": {
                color: "#000000", // Text color for pagination controls
              },
              "& .MuiDataGrid-cell": {
                fontSize: "0.80rem", // Smaller row text
                color: "#000000", // Cell text color
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.1)", // Optional hover effect
              },
            }}
          />
        </div>
      )}
      {showAssignBookletModal && (
        <AssignBookletModal
          setShowAssignBookletModal={setShowAssignBookletModal}
          currentBookletDetails={currentBookletDetails}
          allUsers={allUsers}
        />
      )}
      {assignModel && (
        <AssignModalComp
          setassignModel={setassignModel}
          currentBookletDetails={currentBookletDetails}
        />
      )}
      {qatestingModel && (
        <TestingQA
          setQATestingModel={setQATestingModel}
          currentBookletDetails={currentBookletDetails}
        />
      )}
      {showDeleteModal && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl bg-white p-6 shadow-xl">
            {/* Header */}
            <h2 className="text-lg font-semibold text-gray-800">
              Delete Booklets
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Subject:{" "}
              <span className="font-medium text-gray-700">
                {currentBookletDetails?.folderName}
              </span>
            </p>

            {/* Inputs */}
            <div className="mt-4 flex gap-3">
              <input
                type="number"
                placeholder="From (e.g. 100045)"
                value={range.from}
                onChange={(e) => setRange({ ...range, from: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="number"
                placeholder="To (e.g. 100058)"
                value={range.to}
                onChange={(e) => setRange({ ...range, to: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Helper Text */}
            <p className="mt-2 text-xs text-gray-900">
              • Same number → delete single booklet <br />
              • Different numbers → delete range <br />• Full range → delete all
            </p>

            {/* Error / Validation */}
            {range.from &&
              range.to &&
              Number(range.from) > Number(range.to) && (
                <p className="mt-2 text-xs text-red-500">
                  Invalid range: "From" should be less than or equal to "To"
                </p>
              )}

            {/* Buttons */}
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-md bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                disabled={
                  !range.from ||
                  !range.to ||
                  Number(range.from) > Number(range.to)
                }
                className={`rounded-md px-4 py-2 text-sm text-white ${
                  !range.from ||
                  !range.to ||
                  Number(range.from) > Number(range.to)
                    ? "cursor-not-allowed bg-red-300"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booklets;
