import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { GiCrossMark } from "react-icons/gi";
import routes from "routes";
import ReactSelect from "react-select";

const Modal = ({ user, isOpen, setIsOpen }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "",
    permissions: [],
    subjectCode: [],
    maxBooklets: "",
    changepassword: "",
    deputyHead: "",
  });

  const [subjectDetails, setSubjectDetails] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluators, setEvaluators] = useState([]);
  const [selectedEvaluators, setSelectedEvaluators] = useState([]);

  // console.log(user);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        role: user.role || "",
        permissions: user.permissions || [],
        subjectCode: user.subjectCode || [],
        maxBooklets: user.maxBooklets || "",
        changepassword: user.changepassword || "",
        evaluators: user.evaluators || [],
        deputyHead: user?.deputyHead, // ✅ ADD THIS
      });

      setSelectedEvaluators(user.evaluators || []); // ✅ IMPORTANT
    }
  }, [user]);

  console.log(user, "USER");

  useEffect(() => {
    const fetchAllSubjectDetails = async () => {
      try {
        const subjectDetailsArray = await Promise.all(
          user?.subjectCode.map(async (code) => {
            const response = await axios.get(
              `${process.env.REACT_APP_API_URL}/api/subjects/getbyid/subject/${code}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            return response.data;
          })
        );
        setSubjectDetails(subjectDetailsArray); // Store all subject details
      } catch (error) {
        console.error("Error fetching subject details:", error);
      }
    };

    if (user?.subjectCode?.length) {
      fetchAllSubjectDetails();
    }
  }, [user?.subjectCode]);

  useEffect(() => {
    const fetchEvaluators = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/auth`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const users = Array.isArray(res.data) ? res.data : [];

        const evaluatorUsers = users.filter((u) => u.role === "evaluator");

        console.log("EVALUATORS:", evaluatorUsers); // 🔥 check

        setEvaluators(evaluatorUsers);
      } catch (err) {
        console.error(err);
        setEvaluators([]);
      }
    };

    fetchEvaluators();
  }, []);

  useEffect(() => {
    if (evaluators.length > 0 && user?.evaluators?.length > 0) {
      setSelectedEvaluators(user.evaluators);
    }
  }, [evaluators, user]);

  useEffect(() => {
    const fetchAllSubjects = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/subjects/getall/subject`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setAllSubjects(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchAllSubjects(); // ✅ ALWAYS CALL
  }, []);

  const scanFingerprint = async () => {
    try {
      const response = await fetch("https://localhost:8443/SGIFPCapture", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
        body: "Timeout=10000&Quality=50&templateFormat=ISO",
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.ErrorCode === 0) {
        setFormData((prev) => ({
          ...prev,
          fingerprintTemplate: data.ISOTemplateBase64,
        }));

        toast.success("Fingerprint updated successfully");
      } else {
        toast.error("Fingerprint failed: " + data.ErrorCode);
      }
    } catch (err) {
      toast.error("Scanner connection failed");
    }
  };

  // console.log(subjectDetails)
  // console.log(allSubjects)
  // console.log(user)
  // console.log(formData);

  const handleSubjectChange = (selectedOptions) => {
    const selectedCodes = selectedOptions.map((option) => option.value);
    setFormData((prevData) => ({
      ...prevData,
      subjectCode: selectedCodes,
    }));
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (formData.changepassword && formData.changepassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);
      // const response = await axios.put(
      //   `${process.env.REACT_APP_API_URL}/api/auth/update/${user.id}`,
      //   formData,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       "Content-Type": "application/json",
      //     },
      //   }
      // );

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/auth/update/${user.id}`,
        {
          ...formData,
          fingerprintTemplate: formData.fingerprintTemplate, // ✅ MUST ADD
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setFormData((prevData) => ({
        ...prevData,
        ...response.data.updatedUser,
      }));

      toast.success("User updated successfully!");
      toggleModal();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluatorChange = (selectedOptions) => {
    const ids = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];

    setSelectedEvaluators(ids);

    setFormData((prev) => ({
      ...prev,
      evaluators: ids,
    }));
  };

  const evaluatorOptions = evaluators.map((user) => ({
    value: user._id,
    label: `${user.name} (${user.email})`,
  }));

  const handleCheckboxChange = (routeName) => {
    if (formData?.permissions?.includes(routeName)) {
      setFormData({
        ...formData,
        permissions: formData?.permissions?.filter(
          (perm) => perm !== routeName
        ),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData?.permissions, routeName],
      });
    }
  };

  const subjectOptions = allSubjects.map((subject) => ({
    value: subject._id,
    label: `${subject.name} (${subject.code})`,
  }));

  const selectedSubjects = subjectOptions.filter((option) =>
    formData.subjectCode.includes(option.value)
  );

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="bg-black absolute inset-0 bg-opacity-50 backdrop-blur-md"
            onClick={toggleModal}
          ></div>
          <div className="relative w-full max-w-lg scale-95 transform rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-navy-700 sm:scale-100 sm:p-2">
            <button
              className="absolute right-4 p-2 text-2xl text-gray-700 hover:text-red-700 focus:outline-none sm:top-4"
              onClick={toggleModal}
            >
              <GiCrossMark />
            </button>

            <section className="sm:px-4 sm:py-2">
              <h6 className="my-2 ml-1 text-xl font-semibold text-gray-900 dark:text-white sm:mb-4 sm:text-3xl">
                Edit User Details
              </h6>
              <div className="rounded-xl bg-gray-100 p-3 shadow-inner dark:bg-navy-800 sm:p-4">
                <form
                  className="space-y-0 sm:space-y-3"
                  onSubmit={handleFormSubmit}
                >
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-white"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:p-3"
                      placeholder="Enter name"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-6">
                    <div>
                      <label
                        htmlFor="email"
                        className="mt-2 block text-sm font-medium text-gray-700 dark:text-white"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-1 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:p-3"
                        placeholder="Enter email"
                        disabled
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="mobile"
                        className="mt-2 block text-sm font-medium text-gray-700 dark:text-white"
                      >
                        Mobile
                      </label>
                      <input
                        type="tel"
                        id="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-1 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:p-3"
                        placeholder="Enter Mobile number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-6">
                    <div>
                      <label
                        htmlFor="role"
                        className=" block text-sm font-medium text-gray-700 dark:text-white"
                      >
                        Role
                      </label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-1 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:p-3"
                      >
                        <option value="">Select a role</option>
                        <option value="admin">Admin</option>
                        {/* <option value="principal">Principal</option> */}
                        <option value="evaluator">Evaluator</option>
                        <option value="reviewer">Deputy Head</option>
                        <option value="headevaluator">Head Evaluator</option>
                        <option value="qualitycheck">Quality Check</option>
                        <option value="modulater">Scanner</option>
                      </select>
                    </div>

                    {formData.role !== "admin" &&
                      formData.role !== "reviewer" && (
                        <div>
                          <label
                            htmlFor="maxBooklets"
                            className="block text-sm font-medium text-gray-700 dark:text-white"
                          >
                            Maximum Booklets
                          </label>
                          <input
                            type="text"
                            id="maxBooklets"
                            value={formData.maxBooklets}
                            onChange={handleInputChange}
                            className="mt-1 w-full rounded-lg border border-gray-300 p-1 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:p-3"
                            placeholder="Enter Maximum Booklets"
                          />
                        </div>
                      )}
                  </div>
                  {/* {console.log(formData)} */}

                  {formData.role !== "admin" &&
                    formData.role !== "reviewer" && (
                      <div>
                        <label
                          htmlFor="subjectCode"
                          className="block text-sm font-medium text-gray-700 dark:text-white"
                        >
                          Subjects
                        </label>
                        <div className="bg-white dark:bg-navy-900">
                          <ReactSelect
                            isMulti
                            options={subjectOptions}
                            value={selectedSubjects}
                            onChange={handleSubjectChange}
                            placeholder="+ Add"
                            className="basic-multi-select"
                            classNamePrefix="select"
                            menuPosition="absolute"
                            styles={{
                              control: (base) => ({
                                ...base,
                                borderRadius: "8px",
                                backgroundColor: "transparent",
                                padding: "2px",
                                height: "45px",
                                overflow: "auto",
                              }),
                            }}
                          />
                        </div>
                      </div>
                    )}

                  {formData.role === "reviewer" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Select Evaluators (Max 3)
                      </label>

                      <ReactSelect
                        isMulti
                        options={evaluatorOptions}
                        value={evaluatorOptions.filter((opt) =>
                          selectedEvaluators.some((id) => id === opt.value)
                        )}
                        onChange={handleEvaluatorChange}
                        placeholder="+ Select Evaluators"
                        closeMenuOnSelect={false}
                      />
                    </div>
                  )}

                  <div>
                    <div>
                      <button
                        type="button"
                        onClick={scanFingerprint}
                        className="rounded bg-indigo-600 px-3 py-2 text-white"
                      >
                        Update Fingerprint
                      </button>

                      {formData.fingerprintTemplate && (
                        <p className="text-sm text-green-600">
                          Fingerprint Ready ✓
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="permissions"
                      className="mt-2 block text-sm font-medium text-gray-700 dark:text-white"
                    >
                      Permissions
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-0.5 sm:gap-2">
                      {routes.map((route, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          {/* {console.log(formData)} */}
                          <input
                            type="checkbox"
                            id={`route-${index}`}
                            name="permissions"
                            value={route.name}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={formData?.permissions?.includes(
                              route.name
                            )}
                            onChange={() => handleCheckboxChange(route.name)}
                          />
                          <label
                            htmlFor={`route-${index}`}
                            className="text-sm text-gray-700 dark:text-white"
                          >
                            {route.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    {loading ? (
                      <div
                        className={`mt-2 flex h-full w-full items-center justify-center rounded-lg p-2 py-1 font-medium text-white  shadow-lg transition duration-300 focus:ring-4 sm:py-3 ${
                          loading ? "bg-indigo-400" : "bg-indigo-600"
                        }`}
                      >
                        <svg
                          className="mr-2 h-5 w-5 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Updating...
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="mt-2 w-full rounded-lg bg-indigo-600 p-2 py-1 font-medium text-white shadow-lg transition duration-300 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 sm:py-3"
                        disabled={loading}
                      >
                        Update
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modal;
