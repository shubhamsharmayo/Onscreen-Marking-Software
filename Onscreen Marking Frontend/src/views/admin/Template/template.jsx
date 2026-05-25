import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataContext from "store/DataContext";
import { Trash2, Pencil } from "lucide-react";
import axios from "axios";
import {
  fetchAllTemplate,
  deleteTemplate,
  getTemplateImage,
  getTemplateCsv,
  getLayoutDataById,
  checkJobStatus,
  createTemplate,
} from "helper/TemplateHelper";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import Papa from "papaparse";
import Placeholder from "UI/Placeholder";
import CloneTemplateHandler from "services/CloneTemplate";

const base64ToFile = (base64, filename) => {
  const byteString = atob(base64.split(",")[1]);
  const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeString });
  return new File([blob], filename, { type: mimeString });
};

const Template = () => {
  const [modalShow, setModalShow] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [templateDatail, setTemplateDetail] = useState([]);
  const [toggle, setToggle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateImage, setTemplateImage] = useState(null);

  const navigate = useNavigate();
  const dataCtx = useContext(DataContext);

  useEffect(() => {
    sessionStorage.clear();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setTemplateLoading(true);
      const templates = await fetchAllTemplate();
      if (!templates) {
        toast.error("Error fetching templates");
        setTemplateLoading(false);
        return;
      }
      dataCtx.addToAllTemplate(templates?.body);
      setTemplateLoading(false);
    };
    fetchData();
  }, [toggle]);

  const cloneHandler = async () => {
    const temp = await CloneTemplateHandler(
      templateDatail[0].layoutParameters.id
    );

    if (temp === "Template Cloned Successfully") toast.success(temp);
    else toast.error(temp);

    setToggle((tg) => !tg);
    setShowDetailModal(false);
  };

  const editHandler = async (arr) => {
    setLoading(true);
    const res = await getLayoutDataById(arr.id);
    if (res?.data?.jsonPath === "") toast.warning("Template Not Created Yet!!");
    setLoading(false);
    navigate(`/admin/template/create-template/${arr.id}`);
  };

  const deleteHandler = async (arr) => {
    Swal.fire({
      title: "Delete Template?",
      text: "Are you sure you want to delete this template?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deleteTemplate(arr.id);
        if (res?.state) {
          setToggle((prev) => !prev);
          Swal.fire("Deleted!", "Template deleted successfully", "success");
        } else {
          Swal.fire("Failed", "Could not delete template", "error");
        }
      }
    });
  };

  const filteredTemplates = dataCtx.allTemplates?.filter((t) => {
    const name = (t.fileName || "").toLowerCase();
    const createdBy = (t.createdBy || "").toLowerCase();
    const search = searchText.toLowerCase();
    return name.includes(search) || createdBy.includes(search);
  });

  const handleCreate = async () => {
    if (!templateName || !templateImage) {
      toast.error("Please provide both template name and image.");
      return;
    }

    setLoading(true);
    const res = await createTemplate(templateName, templateImage);
    navigate(`/admin/template/create-template/${res.data[0].id}`);
  };

  return (
    <div className="p-6">
      <div className="rounded-xl bg-white shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="text-xl font-semibold">All Templates</h3>

          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={() => setModalShow(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create Template
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="relative h-[70vh] overflow-auto">
          {loading && (
            <div className="bg-black/20 absolute inset-0 z-50 flex items-center justify-center">
              <div className="border-t-transparent h-10 w-10 animate-spin rounded-full border-4 border-blue-500" />
            </div>
          )}

          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                <th className="px-4 py-3">SL no.</th>
                <th className="px-4 py-3">Template Name</th>
                <th className="px-4 py-3">Creation Date</th>
                {/* <th className="px-4 py-3">Updated Date</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created By</th> */}
                <th className="px-4 py-3"> Edit</th>
                <th className="px-4 py-3 text-right">Delete</th>
              </tr>
            </thead>

            <tbody>
              {templateLoading
                ? new Array(8).fill().map((_, i) => (
                    <tr key={i}>
                      <td colSpan="7" className="p-4">
                        <Placeholder />
                      </td>
                    </tr>
                  ))
                : filteredTemplates?.map((d, i) => (
                    <tr
                      key={i}
                      className="border-b transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{d.fileName}</td>
                      <td className="px-4 py-3">{d.createAt}</td>
                      {/* <td className="px-4 py-3">{d.updateAt || "N/A"}</td>
                      <td className="px-4 py-3">N/A</td>
                      <td className="px-4 py-3">{d.createdBy || "N/A"}</td> */}
                      <td className="space-x-3 px-4 py-3">
                        <button
                          onClick={() => editHandler(d)}
                          className="text-blue-600 hover:underline"
                        >
                          <Pencil />
                        </button>
                      </td>
                      <td className="space-x-3 px-4 py-3 text-right">
                        <button
                          onClick={() => deleteHandler(d)}
                          className="text-red-600 hover:underline"
                        >
                          <Trash2
                            size={30}
                            color="#ff0000"
                            strokeWidth={2.25}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Template Modal */}
      {modalShow && (
        <div className="bg-black/40 fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-[500px] rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Create Template</h3>

            <input
              type="text"
              placeholder="Enter Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mb-4 w-full rounded-lg border px-3 py-2"
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setTemplateImage(e.target.files[0])}
              className="mb-6 w-full rounded-lg border px-3 py-2"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalShow(false)}
                className="rounded-lg border px-4 py-2"
              >
                Close
              </button>
              <button
                onClick={handleCreate}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template;
