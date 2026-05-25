import React, { useEffect, useState } from "react";
import axios from "axios";
import { BsArrowRepeat } from "react-icons/bs";
import { MdEditSquare } from "react-icons/md";
import { MdAutoDelete } from "react-icons/md";
import EditAssingModal from "components/modal/EditAssingModal";
import { getAllUsers } from "services/common";
import ReassignModal from "components/modal/ReassignModal";
import { toast } from "react-toastify";
import { fetchAllTemplate } from "helper/TemplateHelper";
import DirectoryPicker from "views/admin/Folder/DirectoryPicker";
import DeleteConfirmationModalAssignTask from "components/modal/DeleteConfirmationModalAssignTask";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(undefined);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTask, setCurrentTask] = useState({});
  const [showReAssignModal, setShowReAssignModal] = useState(false);
  const [scannerTasks, setScannerTasks] = useState([]);
  const [showScannerTasksModal, setShowScannerTasksModal] = useState(false);
  const [deleteAssignModal, setDeleteAssign] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  // ===== Scanning Job =====
  const [showScanModal, setShowScanModal] = useState(false);
  const [directoryPickerModal, setDirectoryPickerModal] = useState(false);

  const [subjects, setSubjects] = useState([]);

  const [folderName, setFolderName] = useState("");

  const [scanPayload, setScanPayload] = useState({
    subjectCode: "",
    folderName: "",
    userId: "",
  });

  // Function to handle task update after it's submitted from the child modal
  // Update the task in the parent state

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/tasks/get/all/tasks`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        // setTasks(response?.data);
        setTasks(response?.data?.tasks || []);
        setScannerTasks(response?.data?.scannerTasks || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers(localStorage.getItem("token"));
        setUsers(
          response.filter(
            (user) =>
              user.role === "reviewer" ||
              user.role === "evaluator" ||
              user.role === "headevaluator" ||
              user?.role === "qualitycheck" ||
              user.role === "modulater"
          )
        );
      } catch (error) {
        console.error(error);
      }
    };
    fetchUsers();
  }, [setShowEditModal, setShowReAssignModal]);

  useEffect(() => {
    setFilteredTasks(
      selectedUser === undefined
        ? tasks
        : tasks.filter((task) => task.userId?.email === selectedUser.email)
    );
  }, [selectedUser, tasks, setFilteredTasks]);
  useEffect(() => {
    const fetchedSubjects = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/subjects/getall/subject`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setSubjects(response.data || []);
      } catch (error) {
        toast.error("Failed to load subjects");
      }
    };

    fetchedSubjects();
  }, []);

  // Get user name from userId
  const getUserName = (userId) => {
    if (!userId) return "-";

    const id = typeof userId === "object" ? userId._id : userId;

    const user = users.find((u) => u._id === id);

    return user?.name || user?.email || "Unknown";
  };

  const directoryChangeHandler = (directory) => {
    directory = directory.substring(1);

    setFolderName(directory);

    setScanPayload((prev) => ({
      ...prev,
      folderName: directory,
    }));
  };

  const updateTaskInParent = (updatedTask) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === updatedTask._id ? updatedTask : task
      )
    );
  };

  const handleScanningJobSubmit = async () => {
    if (!scanPayload.subjectCode) return toast.error("Select Subject Code");

    if (!scanPayload.userId) return toast.error("Select Scanner");

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/create/scanner/task`,
        scanPayload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Scanning Job Created");
      setShowScanModal(false);
    } catch (err) {
      console.log("Scanner ERROR:", err?.response?.data);
      toast.error(
        err?.response?.data?.message || "Failed to create scanning job"
      );
    }
  };

  return (
    <div className=" h-[650px] rounded-lg bg-lightPrimary px-4 py-2 dark:bg-navy-900">
      <div className="mt-8 flex items-center justify-end gap-4">
        <button
          onClick={() => setShowScanModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Scanning Job
        </button>

        <button
          onClick={() => setShowScannerTasksModal(true)}
          className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          Scanner Tasks
        </button>

        <select
          name="HeadlineAct"
          id="HeadlineAct"
          className="mt-1.5 cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-gray-700 focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white sm:text-sm"
          onChange={(e) =>
            setSelectedUser(users.find((user) => user.email === e.target.value))
          }
        >
          {" "}
          <option
            value=""
            selected
            className="my-4 cursor-pointer rounded-lg bg-gray-200 text-gray-700"
            style={{ cursor: "pointer" }}
          >
            {" "}
            Select User
          </option>
          {users.map((user) => (
            <option
              // value={selectedUser?.email}
              key={user?._id}
              className="my-4 rounded-lg bg-gray-200 py-2 text-gray-700"
              style={{ cursor: "pointer" }}
            >
              {" "}
              {user?.email}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg ">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-gray-200 rounded-md bg-white text-sm dark:divide-gray-700 dark:bg-navy-700 dark:text-white">
            <thead className="bg-gray-100 dark:bg-navy-800 ltr:text-left rtl:text-right">
              <tr>
                {/* <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 dark:text-white">
                  Task Name
                </th> */}
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 dark:text-white">
                  Subject Code
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 dark:text-white">
                  Name
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 dark:text-white">
                  Total Files
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 dark:text-white">
                  Assigned To
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 dark:text-white"></th>
              </tr>
            </thead>
            {filteredTasks.map((filteredTask) => (
              <tbody
                className="divide-y divide-gray-200"
                key={filteredTask?._id}
              >
                <tr className="odd:bg-white dark:bg-navy-700">
                  {/* <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 dark:text-white">
                    {filteredTask?.taskName}
                  </td> */}
                  <td className="whitespace-nowrap px-4 py-2  font-medium text-gray-700 dark:text-white">
                    {filteredTask?.subjectCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2  font-medium text-gray-700 dark:text-white">
                    {filteredTask?.userId?.name}
                  </td>
                  {/* <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-700 dark:text-white">
                    {filteredTask?.className}
                  </td> */}
                  <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-700 dark:text-white">
                    {filteredTask?.totalBooklets}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-700 dark:text-white">
                    {filteredTask?.userId?.email}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-2 font-semibold ${
                      filteredTask?.status === "inactive"
                        ? "text-gray-500"
                        : filteredTask?.status === "active"
                        ? "text-red-600"
                        : filteredTask?.status === "success"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {filteredTask?.status === "inactive"
                      ? "Not Started"
                      : filteredTask?.status === "active"
                      ? "Pending"
                      : filteredTask?.status === "success"
                      ? "Completed"
                      : "-"}
                  </td>
                  <td className="relative">
                    <button
                      className="mx-2 mt-2 rounded-full text-gray-600 transition-all duration-200 ease-in-out hover:rotate-180 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:hover:text-gray-50"
                      onClick={(e) => {
                        const buttonRect = e.target.getBoundingClientRect();
                        setModalPosition({
                          top: buttonRect.bottom + window.scrollY,
                          right: 30,
                        });
                        setShowTaskModal(!showTaskModal);
                        setCurrentTask(filteredTask);
                      }}
                    >
                      <svg
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          strokeWidth="2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        ></path>
                      </svg>
                    </button>
                    {/* Dropdown */}
                  </td>{" "}
                  {showTaskModal && (
                    <div
                      style={{
                        position: "absolute",
                        top: modalPosition.top,
                        right: modalPosition.right,
                        zIndex: 50,
                        width: "200px",
                      }}
                      className="flex flex-col items-center justify-center gap-1 rounded-md bg-white px-4 py-5 shadow-lg dark:bg-navy-700"
                    >
                      <label
                        htmlFor="html"
                        className="hover:bg-zinc-100 relative flex h-10 w-full cursor-pointer select-none items-center justify-between gap-1 rounded-lg bg-gray-100 px-3 font-medium hover:bg-gray-600 peer-checked:bg-blue-50 peer-checked:text-blue-500 peer-checked:ring-1 peer-checked:ring-blue-300 dark:bg-navy-900 dark:hover:hover:bg-gray-700"
                        onClick={() => {
                          setShowReAssignModal(true);
                          setShowTaskModal(false);
                        }}
                      >
                        <div>Re Assign</div>
                        <BsArrowRepeat className="m-2 text-lg " />
                      </label>
                      <label
                        htmlFor="css"
                        className="hover:bg-zinc-100 relative flex h-10 w-full cursor-pointer select-none items-center justify-between gap-1 rounded-lg bg-gray-100 px-3 font-medium hover:bg-indigo-600 hover:text-white peer-checked:bg-blue-50 peer-checked:text-blue-500 peer-checked:ring-1 peer-checked:ring-blue-300 dark:bg-navy-900 dark:hover:hover:bg-indigo-600"
                        onClick={() => {
                          setShowEditModal(true);
                          setShowTaskModal(false);
                        }}
                      >
                        <div>Edit</div>
                        <MdEditSquare className="m-2 text-lg" />
                      </label>
                      <label
                        htmlFor="javascript"
                        className="hover:bg-zinc-100 relative flex h-10 w-full cursor-pointer select-none items-center justify-between gap-1 rounded-lg bg-gray-100 px-3 font-medium hover:bg-red-600 hover:text-white peer-checked:bg-blue-50 peer-checked:text-blue-500 peer-checked:ring-1 peer-checked:ring-blue-300 dark:bg-navy-900 dark:hover:hover:bg-red-600"
                        onClick={() => {
                          setDeleteAssign(true);
                        }}
                      >
                        <div>Delete</div>
                        <MdAutoDelete className="m-2 text-lg " />
                      </label>
                    </div>
                  )}
                </tr>
              </tbody>
            ))}
          </table>
          {showEditModal && (
            <EditAssingModal
              setShowEditModal={setShowEditModal}
              currentTask={currentTask}
              setShowTaskModal={setShowTaskModal}
              setCurrentTask={setCurrentTask}
              updateTaskInParent={updateTaskInParent}
            />
          )}

          {showReAssignModal && (
            <ReassignModal
              setShowReAssignModal={setShowReAssignModal}
              showReAssignModal={showReAssignModal}
              users={users}
              currentTask={currentTask} // ✅ IMPORTANT
              updateTaskInParent={updateTaskInParent}
            />
          )}

          {deleteAssignModal && (
            <DeleteConfirmationModalAssignTask
              setDeleteAssign={setDeleteAssign}
              currentTask={currentTask}
            />
          )}

          {/* ===== Scanning Job Modal ===== */}
          {showScanModal && (
            <div className="bg-black/40 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-semibold">
                  Create Scanning Job
                </h2>

                {/* Template */}
                {/* Subject Code */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium">
                    Subject Code
                  </label>
                  <select
                    className="w-full rounded-lg border px-3 py-2"
                    value={scanPayload.subjectCode}
                    onChange={(e) =>
                      setScanPayload((prev) => ({
                        ...prev,
                        subjectCode: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Subject</option>

                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub.code}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Folder */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium">
                    Folder
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={folderName}
                      readOnly
                      className="w-full rounded-lg border px-3 py-2"
                    />
                    <button
                      onClick={() => setDirectoryPickerModal(true)}
                      className="rounded-lg bg-cyan-600 px-3 text-white"
                    >
                      Pick
                    </button>
                  </div>
                </div>

                {/* Modulater */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium">
                    Scanner
                  </label>
                  <select
                    className="w-full rounded-lg border px-3 py-2"
                    value={scanPayload.userId}
                    onChange={(e) =>
                      setScanPayload((prev) => ({
                        ...prev,
                        userId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Scanner</option>

                    {users
                      .filter((u) => u.role?.toLowerCase() === "modulater")
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.email}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowScanModal(false)}
                    className="rounded-lg border px-4 py-2"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleScanningJobSubmit}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== Scanner Tasks Modal ===== */}
          {showScannerTasksModal && (
            <div className="bg-black/40 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
              <div className="w-[90%] max-w-4xl rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-semibold">Scanner Tasks</h2>

                <div className="max-h-[60vh] overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    {/* <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Subject Code</th>
                        <th className="px-4 py-2 text-left">Folder</th>
                        <th className="px-4 py-2 text-left">Template ID</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {scannerTasks.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-4 text-center text-gray-500"
                          >
                            No Scanner Tasks Found
                          </td>
                        </tr>
                      ) : (
                        scannerTasks.map((task) => (
                          <tr key={task._id}>
                            <td className="px-4 py-2">{task.subjectCode}</td>
                            <td className="px-4 py-2">{task.folderName}</td>
                            <td className="px-4 py-2">{task.templateId}</td>
                            <td
                              className={`px-4 py-2 font-semibold ${
                                task.status === "inactive"
                                  ? "text-gray-500"
                                  : task.status === "active"
                                  ? "text-red-600"
                                  : task.status === "success"
                                  ? "text-green-600"
                                  : ""
                              }`}
                            >
                              {task.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody> */}

                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Subject Code</th>
                        <th className="px-4 py-2 text-left">Folder</th>
                        <th className="px-4 py-2 text-left">Scanner Name</th>
                        <th className="px-4 py-2 text-left">Template ID</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {scannerTasks.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-4 text-center text-gray-500"
                          >
                            No Scanner Tasks Found
                          </td>
                        </tr>
                      ) : (
                        scannerTasks.map((task) => (
                          <tr key={task._id}>
                            <td className="px-4 py-2">{task.subjectCode}</td>
                            <td className="px-4 py-2">{task.folderName}</td>

                            <td className="px-4 py-2">
                              {getUserName(task.userId)}
                            </td>

                            <td className="px-4 py-2">{task.templateId}</td>

                            <td
                              className={`px-4 py-2 font-semibold ${
                                task.status === "inactive"
                                  ? "text-gray-500"
                                  : task.status === "active"
                                  ? "text-red-600"
                                  : task.status === "success"
                                  ? "text-green-600"
                                  : ""
                              }`}
                            >
                              {task.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowScannerTasksModal(false)}
                    className="rounded-lg border px-4 py-2"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {directoryPickerModal && (
            <div className="bg-black/40 fixed inset-0 z-[60] flex items-center  justify-center">
              <div className="ml-32 h-[80vh] w-[80vw] rounded-xl bg-white p-4">
                <h3 className="mb-3 text-lg font-semibold">Select Directory</h3>

                <DirectoryPicker handleChange={directoryChangeHandler} />

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setDirectoryPickerModal(false)}
                    className="rounded-lg border px-4 py-2"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => setDirectoryPickerModal(false)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
