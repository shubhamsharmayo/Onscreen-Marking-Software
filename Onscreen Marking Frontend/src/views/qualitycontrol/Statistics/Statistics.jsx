import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DirectoryPicker from "../Scanner/DirectoryPicker";
import { fetchAllTemplate } from "helper/TemplateHelper";

const ScannerTasks = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- Scan Modal States ----
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [template, setTemplate] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [directoryPickerModal, setDirectoryPickerModal] = useState(false);

  const navigate = useNavigate();

  const selectedTemplate = template.find(
    (t) => String(t.id) === String(templateId)
  );

  // ---------------- FETCH TASKS ----------------
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const loggedUserId = localStorage.getItem("userId");

      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/get/all/scannerTasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ FIX HERE
      const allTasks = Array.isArray(res.data?.data) ? res.data.data : [];

      const filteredTasks = allTasks.filter(
        (task) => String(task?.userId?._id) === String(loggedUserId)
      );

      setTableData(filteredTasks);
    } catch (err) {
      console.error(err);
      setError("Failed to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FETCH TEMPLATE ----------------
  const fetchTemplates = async () => {
    try {
      const templates = await fetchAllTemplate();
      if (templates) {
        setTemplate(templates?.body || []);
      }
    } catch (err) {
      console.error("Template fetch error", err);
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchTemplates();
  }, []);

  // ---------------- DIRECTORY HANDLER ----------------
  const directoryChangeHandler = (directory) => {
    directory = directory.substring(1);
    setFolderName(directory);
  };

  // ---------------- CONFIRM BUTTON CLICK ----------------
  const handleOpenScanModal = (task) => {
    setSelectedTask(task);

    // folder from task
    setFolderName(task.folderName || "");

    // template from task (AUTO SET)
    const taskTemplateId = task?.templateId?._id || task?.templateId || "";

    setTemplateId(taskTemplateId);

    setShowScanModal(true);
  };

  // ---------------- START SCAN ----------------
  const handleConfirmScan = () => {
    if (!folderName) return toast.error("No Folder Selected");
    if (!templateId) return toast.error("No Template Selected");

    localStorage.setItem("folderName", folderName);
    localStorage.setItem("templateId", templateId);
    localStorage.setItem("taskId", selectedTask?._id);

    setShowScanModal(false);

    navigate("/modulater/job-queue/adminscanjob");
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
          Scanner Tasks
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View and start assigned scanning jobs
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-lg bg-white p-6 text-center shadow">
          <div className="animate-pulse text-gray-500">Loading tasks...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Folder</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {tableData.length > 0 ? (
                  tableData.map((item, index) => (
                    <tr
                      key={item._id}
                      className="border-b transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">{index + 1}</td>

                      <td className="px-4 py-3 font-medium text-gray-700">
                        {item.folderName || "-"}
                      </td>

                      <td className="px-4 py-3">{item.subjectCode || "-"}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold
                        ${
                          item.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        >
                          {item.status || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white transition hover:bg-green-700"
                          onClick={() => handleOpenScanModal(item)}
                        >
                          Confirm
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-gray-500">
                      No tasks assigned yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- SCAN MODAL ---------- */}
      <Modal show={showScanModal} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Start Scanning</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <label className="form-label fw-semibold">Data Path</label>

          <div className="d-flex mb-3 gap-2">
            <input className="form-control" disabled value={folderName} />
            <Button
              variant="outline-primary"
              onClick={() => setDirectoryPickerModal(true)}
            >
              Choose
            </Button>
          </div>

          <label className="form-label fw-semibold">Template</label>
          <input
            className="form-control"
            disabled
            value={selectedTemplate?.fileName || "Template not found"}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowScanModal(false)}>
            Cancel
          </Button>

          <Button variant="success" onClick={handleConfirmScan}>
            Confirm & Start
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ---------- DIRECTORY MODAL ---------- */}
      <Modal show={directoryPickerModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Directory</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ height: "65dvh" }}>
          <DirectoryPicker handleChange={directoryChangeHandler} />
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => setDirectoryPickerModal(false)}>
            Save Directory
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ScannerTasks;
