//import Header from "components/Headers/Header.js";
//import NormalHeader from "components/Headers/NormalHeader";
import { Modal } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect, useRef, useState, useCallback } from "react";
import Select from "react-select";
import { fetchProcessData } from "helper/Booklet32Page_helper";
import { Button, Card, CardHeader, Container, Row, Table } from "reactstrap";
import { refreshScanner } from "helper/Booklet32Page_helper";
import { scanFiles } from "helper/Booklet32Page_helper";
// import { GridComponent, ColumnsDirective, ColumnDirective, Sort, Inject, Toolbar, Page, Filter, Edit } from '@syncfusion/ej2-react-grids';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Sort,
  Inject,
  Toolbar,
  ExcelExport,
  Filter,
  Resize,
} from "@syncfusion/ej2-react-grids";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useLocation, useNavigate } from "react-router-dom";
import { cancelScan } from "helper/TemplateHelper";
import { finishJob } from "helper/job_helper";
import { getUrls } from "helper/url_helper";
import PrintModal from "UI/PrintModal";
import jsonData from "data/jsonDataTest";
import { headerData } from "data/jsonDataTest";
import { VirtualScroll } from "@syncfusion/ej2-grids";
import { getTotalExcellRow } from "helper/Booklet32Page_helper";
import { getDataByRowRange } from "helper/Booklet32Page_helper";
import getBaseUrl from "services/BackendApi";
import ImageViewer from "react-simple-image-viewer";
import { Rnd } from "react-rnd";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import RecognizationBtn from "UI/RecognizationBtn";
import RecognizationModal from "UI/RecognizationModal";
import { pauseScanning } from "helper/Booklet32Page_helper";
import { resumeScanning } from "helper/Booklet32Page_helper";
import { getLayoutDataById } from "helper/TemplateHelper";
import ZoomViewer from "components/ZoomView";
import { getLastScannedFiles } from "helper/Booklet32Page_helper";
import { useScan } from "context/ScanningContext";

// --- Debounce helper ---
function debounce(func, delay = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

function emptyMessageTemplate() {
  return (
    <div className="text-center">
      <img
        src={
          "https://ej2.syncfusion.com/react/demos/src/grid/images/emptyRecordTemplate_light.svg"
        }
        className="d-block mx-auto my-2"
        alt="No record"
      />
      <span>There is no data available to display at the moment.</span>
    </div>
  );
}

let num = JSON.parse(localStorage.getItem("lastSerialNo"), 10) || 1;

const MAX_VISIBLE = 150;
const LOAD_SIZE = 100;
const LOCAL_KEY = "scan_old_data"; // user requested key

const AdminScanJob = () => {
  const {
    isScanning,
    isPausedContext,
    isStarting,
    setIsScanning,
    setIsPausedContext,
    setIsStarting,
  } = useScan();

  // --- states ---
  const [count, setCount] = useState(true);
  const [processedData, setProcessedData] = useState([]); // visible records (can grow when loading older)
  const [scanning, setScanning] = useState(false);
  const [headData, setHeadData] = useState(["Student Data"]);
  const [borderRowId, setBorderRowId] = useState(null);

  const filterSettings = { type: "Excel" };
  const editSettings = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
  };
  const [items, setItems] = useState([]);
  const [selectedValue, setSelectedValue] = useState();
  const [toolbar, setToolbar] = useState(["ExcelExport", "CsvExport"]);
  const [services, setServices] = useState([
    Sort,
    Toolbar,
    Filter,
    ExcelExport,
    Resize,
  ]);
  const [gridHeight, setGridHeight] = useState("850px");
  const [starting, setStarting] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 576);
  const [proccessUrl, setProcessURL] = useState("");
  const [showPrintModal, setShowPrintModal] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [scrollState, setScrollState] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [baseUrl, setBaseURL] = useState(null);
  const [lastSerialNo, setLastSerialNo] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [showRecognizationModal, setShowRecognizationModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [templateData, setTemplateData] = useState([]);
  const [obj, setObj] = useState({});
  const [dbState, setDbState] = useState(false);

  const [isWaitingToLoad, setIsWaitingToLoad] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const template = emptyMessageTemplate;

  const fileHandleRef = useRef(null);
  const writableRef = useRef(null);
  const headerWrittenRef = useRef(false);
  const fileClosedRef = useRef(false);

  const gridRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const serialRef = useRef();
  const isStartingRef = useRef(false);
  const isTogglingRef = useRef(false);

  // timeout ref to manage the 3s wait
  const waitingTimeoutRef = useRef(null);

  // --- helper localStorage functions ---
  const readLocal = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to read local storage for scans", e);
      return [];
    }
  };

  const writeLocal = (arr) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
    } catch (e) {
      console.error("Failed to write to local storage", e);
    }
  };

  const saveToLocal = (records) => {
    if (!records || records.length === 0) return;
    const existing = readLocal(); // oldest ... newest (we maintain ordering oldest->newest)
    const merged = [...existing, ...records];
    writeLocal(merged);
  };

  /**
   * Load up to 'LOAD_SIZE' most-recent items from local storage (those at the tail),
   * remove them from storage, and return the chunk (in the correct order oldest->newest).
   */

  const pullFromLocal = (size = LOAD_SIZE) => {
    const storage = readLocal();
    if (storage.length === 0) return [];
    const take = Math.min(size, storage.length);
    // take last 'take' entries (most-recent saved)
    const chunk = storage.slice(storage.length - take, storage.length);
    const remaining = storage.slice(0, storage.length - take);
    writeLocal(remaining);
    return chunk;
  };

  /**
   * Core function to append new incoming records (from WS / API / refresh).
   * - Appends to visible data
   * - If visible length > MAX_VISIBLE, move extras (older ones) to local storage
   */
  const pushNewRecords = useCallback((newRecords = []) => {
    if (!newRecords || newRecords.length === 0) return;
    setProcessedData((prev) => {
      const updated = [...prev, ...newRecords];
      if (updated.length > MAX_VISIBLE) {
        const extraCount = updated.length - MAX_VISIBLE;
        const extra = updated.slice(0, extraCount); // oldest entries to move out
        const latest = updated.slice(extraCount); // keep newest MAX_VISIBLE
        saveToLocal(extra);
        // persist last serial no
        const lastSlNo = latest.length
          ? latest[latest.length - 1]["Serial No"]
          : num - 1;
        localStorage.setItem("lastSerialNo", JSON.stringify(lastSlNo));
        // refresh grid after state update will be called by useEffect where needed
        return latest;
      } else {
        // persist last serial no if any
        const lastSlNo = updated.length
          ? updated[updated.length - 1]["Serial No"]
          : num - 1;
        localStorage.setItem("lastSerialNo", JSON.stringify(lastSlNo));
        return updated;
      }
    });
    // ensure grid refresh if available
    setTimeout(() => {
      try {
        gridRef.current?.refresh();
      } catch (e) {
        // ignore
      }
    }, 100);
  }, []);

  // --- initial data fetch (existing logic) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const templateId = localStorage.getItem("templateId");
        const response = await getLastScannedFiles(templateId);

        if (response?.state) {
          const data = response?.res;

          if (Array.isArray(data) && data.length > 0) {
            setHeadData(Object.keys(data[0])); // Use first row to get headers
            // map to include Serial No if not present
            const mapped = data.map((d) => {
              if (!d["Serial No"]) {
                const newItem = { ...d, ["Serial No"]: num++ };
                return newItem;
              }
              return d;
            });
            // push through buffer so it trims/saves as needed
            pushNewRecords(mapped);
            console.log("Fetched data:", data);
          } else {
            console.log("No data received.");
          }
        }
      } catch (error) {
        console.error("Initial fetch error", error);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  useEffect(() => {
    const fetchBaseUrl = async () => {
      try {
        const base = await getBaseUrl(); // your custom function
        if (base) {
          const url = new URL(base);
          setBaseURL(url.host);
        }
      } catch (error) {
        console.error("Failed to fetch base URL:", error);
      }
    };

    fetchBaseUrl();
  }, []);

  // // --- WebSocket: push through pushNewRecords ---
  // useEffect(() => {
  //   if (!baseUrl) return;

  //   const token = localStorage.getItem("token");
  //   const ws = new WebSocket(`ws://${baseUrl}/ws?token=${token}`);
  //   let isHeadSet = false;

  //   // console.log(ws)

  //   ws.onopen = () => {
  //     console.log("WebSocket connected");
  //   };

  //   ws.onmessage = (event) => {
  //     // If event is string 'success' treat separately
  //     if (event.data === "success") {
  //       console.log("success");
  //       return;
  //     }

  //     try {
  //       const json = JSON.parse(event.data);
  //       const data = json; // depending on payload shape, adjust as needed

  //       if (data) {
  //         // Set header only once
  //         if (!isHeadSet) {
  //           setHeadData(Object.keys(data));
  //           isHeadSet = true;
  //         }

  //         console.log(data)

  //         // Ensure Serial No exists for incoming row
  //         const row = { ...data };
  //         if (!row["Serial No"]) {
  //           row["Serial No"] = num++;
  //         }

  //         // Use core push function
  //         pushNewRecords([row]);
  //       }
  //     } catch (err) {
  //       console.error("Failed to parse WS message:", event.data, err);
  //     }
  //   };

  //   ws.onerror = (error) => {
  //     console.error("WebSocket error:", error);
  //   };

  //   ws.onclose = () => {
  //     console.log("WebSocket closed");
  //   };

  //   return () => {
  //     ws.close();
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [baseUrl, pushNewRecords]);

  // useEffect(() => {
  //   if (!baseUrl) return;

  //   const token = localStorage.getItem("token");
  //   const ws = new WebSocket(`ws://${baseUrl}/ws?`);
  //   let isHeadSet = false;

  //   // Flags to prevent writing to a closed/closing file
  //   const fileClosingRef = { current: false };

  //   ws.onopen = () => console.log("WebSocket connected");

  //   ws.onmessage = async (event) => {
  //     if (event.data === "success") return;

  //     // Skip processing if file is closing
  //     if (fileClosingRef.current) return;

  //     try {
  //       const data = JSON.parse(event.data);
  //       if (!data) return;

  //       // Set frontend table header once
  //       if (!isHeadSet) {
  //         setHeadData(Object.keys(data));
  //         isHeadSet = true;
  //       }

  //       const row = { ...data };
  //       if (!row["Serial No"]) row["Serial No"] = num++;

  //       // Write CSV header once
  //       if (writableRef.current && !headerWrittenRef.current) {
  //         const headers =
  //           Object.keys(row)
  //             .map((h) => `"${h.replace(/"/g, '""')}"`)
  //             .join(",") + "\n";

  //         try {
  //           await writableRef.current.write(headers);
  //           headerWrittenRef.current = true;
  //         } catch (err) {
  //           // Ignore InvalidStateError (stream closing)
  //           if (err.name !== "InvalidStateError") console.error(err);
  //         }
  //       }

  //       // Write CSV row safely
  //       if (writableRef.current && !fileClosingRef.current) {
  //         const line =
  //           Object.values(row)
  //             .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
  //             .join(",") + "\n";

  //         try {
  //           await writableRef.current.write(line);
  //         } catch (err) {
  //           // Ignore InvalidStateError (stream closing)
  //           if (err.name !== "InvalidStateError") console.error(err);
  //         }
  //       }

  //       // Update frontend table
  //       pushNewRecords([row]);
  //     } catch (err) {
  //       console.error("Failed to parse WS message:", err);
  //     }
  //   };

  //   ws.onerror = (error) => console.error("WebSocket error:", error);

  //   ws.onclose = async () => {
  //     console.log("WebSocket closed");

  //     // Close CSV safely
  //     if (writableRef.current && !fileClosingRef.current) {
  //       fileClosingRef.current = true; // lock to prevent further writes
  //       try {
  //         await writableRef.current.close();
  //         console.log("CSV file saved and closed on WebSocket close");
  //       } catch (err) {
  //         // Ignore closing errors
  //         if (err.name !== "InvalidStateError") console.warn(err);
  //       } finally {
  //         writableRef.current = null;
  //       }
  //     }
  //   };

  //   // Cleanup WebSocket on unmount or baseUrl change
  //   return () => ws.close();
  // }, [baseUrl, pushNewRecords]);

  // useEffect(() => {
  //   if (!baseUrl) return;

  //   // ❌ token removed completely
  //   // const ws = new WebSocket(`ws://${baseUrl}/ws`);
  //   const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  //   const ws = new WebSocket(`${protocol}://${baseUrl}/ws`);

  //   let isHeadSet = false;

  //   const fileClosingRef = { current: false };

  //   ws.onopen = () => {
  //     console.log("WebSocket connected");
  //   };

  //   ws.onmessage = async (event) => {
  //     if (event.data === "success") return;
  //     if (fileClosingRef.current) return;

  //     try {
  //       const data = JSON.parse(event.data);
  //       if (!data) return;

  //       if (!isHeadSet) {
  //         setHeadData(Object.keys(data));
  //         isHeadSet = true;
  //       }

  //       const row = { ...data };
  //       if (!row["Serial No"]) row["Serial No"] = num++;

  //       // write CSV header once
  //       if (writableRef.current && !headerWrittenRef.current) {
  //         const headers =
  //           Object.keys(row)
  //             .map((h) => `"${h.replace(/"/g, '""')}"`)
  //             .join(",") + "\n";

  //         await writableRef.current.write(headers);
  //         headerWrittenRef.current = true;
  //       }

  //       // write CSV row
  //       if (writableRef.current && !fileClosingRef.current) {
  //         const line =
  //           Object.values(row)
  //             .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
  //             .join(",") + "\n";

  //         await writableRef.current.write(line);
  //       }

  //       pushNewRecords([row]);
  //     } catch (err) {
  //       console.error("WS parse error:", err);
  //     }
  //   };

  //   ws.onerror = (error) => {
  //     console.error("WebSocket error:", error);
  //   };

  //   ws.onclose = async () => {
  //     console.log("WebSocket closed");

  //     if (writableRef.current && !fileClosingRef.current) {
  //       fileClosingRef.current = true;
  //       try {
  //         await writableRef.current.close();
  //       } catch (err) {
  //         if (err.name !== "InvalidStateError") {
  //           console.warn(err);
  //         }
  //       } finally {
  //         writableRef.current = null;
  //       }
  //     }
  //   };

  //   return () => ws.close();
  // }, [baseUrl, pushNewRecords]);

  useEffect(() => {
    if (!baseUrl) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "wss";
    const wsUrl = `${protocol}://${baseUrl}/ws`;

    const ws = new WebSocket(wsUrl);

    let isHeadSet = false;
    const fileClosingRef = { current: false };

    ws.onopen = () => {
      console.log("WebSocket connected:", wsUrl);
    };

    ws.onmessage = async (event) => {
      if (event.data === "success") return;
      if (fileClosingRef.current) return;

      try {
        const data = JSON.parse(event.data);
        if (!data) return;

        if (!isHeadSet) {
          setHeadData(Object.keys(data));
          isHeadSet = true;
        }

        const row = { ...data };
        if (!row["Serial No"]) row["Serial No"] = num++;

        if (writableRef.current && !headerWrittenRef.current) {
          const headers =
            Object.keys(row)
              .map((h) => `"${h.replace(/"/g, '""')}"`)
              .join(",") + "\n";

          await writableRef.current.write(headers);
          headerWrittenRef.current = true;
        }

        if (writableRef.current && !fileClosingRef.current) {
          const line =
            Object.values(row)
              .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
              .join(",") + "\n";

          await writableRef.current.write(line);
        }

        pushNewRecords([row]);
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onclose = async () => {
      if (writableRef.current && !fileClosingRef.current) {
        fileClosingRef.current = true;
        try {
          await writableRef.current.close();
        } catch {}
        writableRef.current = null;
      }
    };

    return () => ws.close();
  }, [baseUrl, pushNewRecords]);

  // --- fetch layout data (no change) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const templateId = localStorage.getItem("templateId");
        const base = await getBaseUrl();
        const res = await getLayoutDataById(templateId);
        if (res) {
          const jsonPath = res?.data?.jsonPath;
          const res2 = await axios.get(`${base}${jsonPath}`, {
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
              Expires: "0",
            },
          });
          if (res2?.data && res2?.data?.fields) {
            setTemplateData(res2.data.fields);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching data");
      }
    };
    if (baseUrl) {
      fetchData();
    }
  }, [baseUrl]);

  // --- attach scroll listener for grid content ---

  useEffect(() => {
    const calculateGridHeight = () => {
      const height = window.innerHeight * 0.65;
      setGridHeight(`${height}px`);
    };

    calculateGridHeight();
    window.addEventListener("resize", calculateGridHeight);
    return () => {
      window.removeEventListener("resize", calculateGridHeight);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getUrls();
      const GetDataURL = response.GET_PROCESS_32_PAGE_DATA;
      setProcessURL(GetDataURL);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const localTemplateId = localStorage.getItem("scantemplateId");
    const templateName = localStorage.getItem("templateName");
    if (localTemplateId) {
      setSelectedValue(localTemplateId);
      setTemplateName(templateName);
    }
  }, [location]);

  // --------------- SCROLL HANDLER with 3s wait ---------------
  // declared with useCallback to keep stable reference for addEventListener
  // --- State declarations above ---

  // --- helper for scrolling with 3s wait ---
  const handleScroll = useCallback(
    async (e) => {
      const scrollTop = e?.target?.scrollTop;
      if (scrollTop !== 0) return;

      if (isWaitingToLoad || isLoadingOlder) return;

      setIsWaitingToLoad(true);
      toast.info("Loading more records in 3s...");

      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current);
      }

      waitingTimeoutRef.current = setTimeout(async () => {
        setIsWaitingToLoad(false);
        setIsLoadingOlder(true);
        toast.info("Loading more records...");

        try {
          const chunk = pullFromLocal(LOAD_SIZE);
          if (chunk.length > 0) {
            setProcessedData((prev) => [...chunk, ...prev]);
            setTimeout(() => gridRef.current?.refresh(), 100);
          } else {
            toast.info("No more older records in local storage.");
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingOlder(false);
        }
      }, 3000);
    },
    [isWaitingToLoad, isLoadingOlder]
  );

  useEffect(() => {
    const attach = () => {
      const gridContainer =
        gridRef.current?.element?.querySelector(".e-content");
      if (gridContainer) {
        gridContainer.addEventListener("scroll", handleScroll);
      }
    };
    attach();
    return () => {
      try {
        const gridContainer =
          gridRef.current?.element?.querySelector(".e-content");
        if (gridContainer) {
          gridContainer.removeEventListener("scroll", handleScroll);
        }
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridRef, handleScroll]);

  // --------------- API fetch integration (getScanData) ---------------
  const getScanData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userInfo = jwtDecode(token);
      const userId = userInfo.UserId;

      const res = await axios.get(
        proccessUrl + `?Id=${selectedValue}&UserId=${userId}`
      );
      const data = res.data;

      if (data?.result?.success) {
        const newDataKeys = Object.keys(data.result.data[0]).map((key) => {
          return key.endsWith(".") ? key.slice(0, -1) : key;
        });
        setHeadData(["Serial No", ...newDataKeys]);

        let updatedData = data.result.data.map((item) => {
          const newItem = {};
          for (const key in item) {
            const newKey = key.endsWith(".") ? key.slice(0, -1) : key;
            newItem[newKey] = item[key];
          }
          newItem["Serial No"] = num++;
          return newItem;
        });

        // Use pushNewRecords so trimming works
        pushNewRecords(updatedData);

        gridRef.current?.refresh();
        return res;
      }

      return {
        success: false,
        data: res?.data?.result,
        message: "The API response did not indicate success.",
      };
    } catch (error) {
      console.error(error);
      setTimeout(() => {
        handleStop();
      }, 1000);
      toast.error("Unable to fetch data!!!");
      return error;
    }
  };

  // intervalCreation retained (no change)
  const intervalCreation = (data) => {
    const interval = setInterval(() => {
      setItems((prevItems) => {
        const nextIndex = prevItems.length;
        if (nextIndex < data.length) {
          return [...prevItems, data[nextIndex]];
        } else {
          clearInterval(interval);
          return prevItems;
        }
      });
    }, 1000);
  };

  // --------------- Start / Pause / Resume logic (unchanged) ---------------
  // const handleStart = async () => {
  //   try {
  //     setScanning(true);
  //     const folderName = localStorage.getItem("folderName");
  //     const templateId = localStorage.getItem("templateId");
  //     if (!folderName || !templateId) {
  //       toast.error("Please select a folder and template");
  //       return;
  //     }
  //     const token = localStorage.getItem("token");
  //     const res = await scanFiles(folderName, templateId, dbState);
  //   } catch (error) {
  //     console.log(error);
  //     if (error?.response?.data) {
  //       toast.error(error?.response?.data);
  //     }
  //   } finally {
  //     setScanning(false);
  //   }
  // };

  const handleStart = async () => {
    try {
      // 1️⃣ Pick CSV file location
      fileHandleRef.current = await window.showSaveFilePicker({
        suggestedName: "live_data.csv",
        types: [
          {
            description: "CSV File",
            accept: { "text/csv": [".csv"] },
          },
        ],
      });

      // 2️⃣ Create writable once
      writableRef.current = await fileHandleRef.current.createWritable();

      // 3️⃣ Write BOM for Excel
      await writableRef.current.write("\uFEFF");

      headerWrittenRef.current = false;

      // 4️⃣ Start scanning
      setScanning(true);
      const folderName = localStorage.getItem("folderName");
      const templateId = localStorage.getItem("templateId");
      if (!folderName || !templateId) {
        toast.error("Please select a folder and template");
        return;
      }

      const token = localStorage.getItem("token");
      await scanFiles(folderName, templateId, dbState);
    } catch (error) {
      console.error(error);
      if (error?.response?.data) toast.error(error.response.data);
    } finally {
      setScanning(false);

      // 5️⃣ Close CSV file safely
      if (writableRef.current) {
        await writableRef.current.close();
        toast.success("CSV file saved and closed!");
      }
    }
  };

  const handleSave = (args) => {
    if (args.data) {
      const updatedData = [...processedData];
      const index = updatedData.findIndex(
        (item) => item["Serial No"] == args.data["Serial No"]
      );
      if (index > -1) {
        updatedData[index] = args.data;
        setProcessedData(updatedData);
      }
    }
  };

  const handleRefresh = () => {
    try {
      refreshScanner();
    } catch (error) {
      console.log(error);
      toast.error("Error in Refresh");
    }
  };

  const dataBound = () => {
    if (!isAutoScrollEnabled || scanning) return;

    if (gridRef.current) {
      const grid = gridRef.current;
      const lastIndex = grid.dataSource.length - 1;

      if (lastIndex >= 0) {
        setTimeout(() => {
          const gridContent = grid?.getContent()?.firstElementChild;
          if (gridContent) {
            gridContent.scrollTo({
              top: gridContent.scrollHeight,
              behavior: "smooth",
            });
          }
        }, 100);
      }
    }
  };

  const handlePause = async () => {
    try {
      await pauseScanning();
      setIsPaused(true);
      toast.warning("Scanning paused");
    } catch (error) {
      console.error("Error pausing scan:", error);
      toast.error("Failed to pause scanning");
    }
  };
  const handleResume = async () => {
    try {
      await resumeScanning();
      setIsPaused(false);
      toast.info("Scanning resumed");
    } catch (error) {
      console.error("Error resuming scan:", error);
      toast.error("Failed to resume scanning");
    }
  };

  const handleToolbarClick = (args) => {
    const id = args.item.id.toLowerCase();
    if (id.includes("excelexport")) {
      gridRef.current.excelExport();
    }
    if (id.includes("pdfexport")) {
      gridRef.current.pdfExport();
    }
    if (id.includes("csvexport")) {
      gridRef.current.csvExport();
    }
  };

  const handleStop = async () => {
    try {
      if (!isPaused) {
        setIsPaused(true);
        await pauseScanning();
        toast.warning("Scanning paused");
      } else {
        setIsPaused(false);
        await resumeScanning();
        toast.info("Scanning resumed");
      }
    } catch (error) {
      console.error("Error toggling scan state:", error);
      toast.error("Failed to toggle scanning state");
    }
  };

  const debouncedStart = useRef(debounce(handleStart, 500)).current;
  const debouncedResume = useRef(debounce(handleResume, 500)).current;
  const debouncedPause = useRef(debounce(handlePause, 500)).current;

  const columnsDirective = headData.map((item, index) => {
    return (
      <ColumnDirective
        field={item}
        key={index}
        headerText={item}
        width="120"
        textAlign="Center"
      ></ColumnDirective>
    );
  });

  const completeJobHandler = async () => {
    try {
      if (!window.confirm("Are you sure you want to finish the job?")) return;

      const taskId = localStorage.getItem("taskId");
      const userId = localStorage.getItem("userId");
      const folderName = localStorage.getItem("folderName");

      if (!taskId || !userId || !folderName) {
        toast.error("Missing required task information.");
        return;
      }

      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/change/scannerTaskStatus`,
        { taskId, userId, folderName }
      );

      if (data?.success) {
        toast.success("Job completed successfully!");
        navigate("/admin/job-queue", { replace: true });
      } else {
        toast.error(data?.message || "Failed to complete job.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error while completing job.");
    }
  };

  const rowDataBound = (args) => {
    const rowData = args.data;

    // RESET STYLES
    args.row.style.border = "";
    args.row.style.boxShadow = "";
    args.row.style.borderRadius = "";
    args.row.style.backgroundColor = "";
    args.row.style.color = "";

    if (rowData?.FileName === borderRowId) {
      args.row.style.backgroundColor = "#d4d4d4";
      args.row.style.borderRadius = "10px";
    }

    if (rowData?.Success === "False") {
      args.row.style.backgroundColor = "#f8d7da";
      args.row.style.color = "#721c24";
    }

    Object.keys(rowData).forEach((key) => {
      if (rowData[key] === null || rowData[key] === "") {
        const cellIndex = args.row.cells.findIndex(
          (cell) => cell.column && cell.column.field === key
        );

        if (cellIndex !== -1) {
          args.row.cells[cellIndex].style.backgroundColor = "yellow";
        }
      }
    });
  };

  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      // Clear visible and local storage (fresh start)
      setProcessedData([]);
      writeLocal([]);
      toast.info("Cleared visible data and local storage.");
    } catch (error) {
      toast.error("Could not get data");
      console.log(error);
    } finally {
      setIsRefreshing(false);
      gridRef.current?.refresh();
    }
  };

  const handleOldRefreshData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userInfo = jwtDecode(token);
      const userId = userInfo.UserId;

      const res = await axios.get(
        proccessUrl + `?Id=${selectedValue}&UserId=${userId}`
      );
      const data = res.data;

      if (data?.result?.success) {
        const newDataKeys = Object.keys(data.result.data[0]).map((key) => {
          return key.endsWith(".") ? key.slice(0, -1) : key;
        });
        setHeadData(["Serial No", ...newDataKeys]);

        let updatedData = data.result.data.map((item) => {
          const newItem = {};
          for (const key in item) {
            const newKey = key.endsWith(".") ? key.slice(0, -1) : key;
            newItem[newKey] = item[key];
          }
          newItem["Serial No"] = num++;
          return newItem;
        });

        // Use pushNewRecords so trimming works
        pushNewRecords(updatedData);
      }
      gridRef.current.refresh();
    } catch (error) {
      console.log(error);
    }
  };

  const onRowSelected = (args) => {
    const rowData = args.data;

    setBorderRowId(rowData?.FileName);
    setIsViewerOpen(true);
    setCurrentImage(rowData?.FileName);
  };

  const handleGridClick = (e) => {
    if (!e.target.closest(".e-row")) {
      setBorderRowId(null);
      setIsViewerOpen(false);
    }
  };

  const onCellSelected = (args) => {
    const rowData = args.data;
    const columnField = args.currentCell.cellIndex;
    const objKeys = Object.keys(rowData);
    const columnHeader = objKeys[columnField];

    const filter = templateData.filter(
      (item) => item.fieldName === columnHeader
    );
    if (filter && filter[0]) {
      const { x, y, width, height } = filter[0];
      setObj({ x, y, width, height });
    }

    setIsViewerOpen(true);
    setCurrentImage(rowData?.FileName);
  };

  const closeImageViewer = () => {
    setIsViewerOpen(false);
  };

  // expose scanning/paused state to context
  setIsScanning(scanning);
  setIsPausedContext(isPaused);

  // render
  return (
    <>
      {/* <NormalHeader /> */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          padding: "10px",
          zIndex: "999",
        }}
      >
        <nav
          style={{
            "--bs-breadcrumb-divider": "'>'",
            pointerEvents: scanning ? "none" : "auto",
            opacity: scanning ? 0.5 : 1,
          }}
          aria-label="breadcrumb"
        >
          <ol className="breadcrumb" style={{ fontSize: "0.8rem" }}>
            <li className="breadcrumb-item">
              <Link to="/admin/job-queue">Job queue</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {templateName}
            </li>
          </ol>
        </nav>
      </div>
      <div
        style={{
          position: "absolute",
          left: isSmallScreen ? "30%" : "40%",
          top: isSmallScreen ? "10px" : "20px",
          zIndex: "999",
        }}
      >
        <Button
          variant="primary"
          disabled={scanning}
          onClick={completeJobHandler}
        >
          Complete Job
        </Button>
      </div>

      <Container className={isSmallScreen ? "mt--6" : "mt--8"} fluid>
        <br />
        <div style={{ position: "relative" }}>
          <select
            className="form-select"
            onChange={(e) => {
              const value = e.target.value === "true";
              setDbState(value);
            }}
            value={dbState.toString()}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 99,
              width: "200px",
            }}
          >
            <option value={"false"}>Don't Save To DB</option>
            <option value={"true"}>Save To DB</option>
          </select>
        </div>

        <div className="control-section" style={{ position: "relative" }}>
          {/* Loading banner shown when waiting/loading older */}
          {isWaitingToLoad && (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#fff3cd",
                color: "#856404",
                padding: "6px 12px",
                borderRadius: 6,
                zIndex: 1050,
              }}
            >
              Loading more records in 3s...
            </div>
          )}
          {isLoadingOlder && (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#cce5ff",
                color: "#004085",
                padding: "6px 12px",
                borderRadius: 6,
                zIndex: 1050,
              }}
            >
              Loading more records...
            </div>
          )}

          <GridComponent
            ref={gridRef}
            onClick={handleGridClick}
            dataBound={dataBound}
            actionComplete={handleSave}
            dataSource={processedData}
            height={gridHeight}
            allowSorting={false}
            editSettings={editSettings}
            allowFiltering={false}
            filterSettings={filterSettings}
            toolbar={toolbar}
            enableVirtualization={isAutoScrollEnabled}
            toolbarClick={handleToolbarClick}
            allowExcelExport={true}
            allowPdfExport={false}
            allowEditing={false}
            allowResizing={true}
            emptyRecordTemplate={template.bind(this)}
            selectionSettings={{
              mode: "Row",
              type: "Single",
            }}
            rowDataBound={rowDataBound}
            rowSelected={onRowSelected}
            cellSelected={onCellSelected}
          >
            <ColumnsDirective>{columnsDirective}</ColumnsDirective>
            <Inject services={services} />
          </GridComponent>

          {isViewerOpen && (
            <Rnd
              default={{
                x: window.innerWidth / 2 - 250,
                y: window.innerHeight / 2 - 450,
                width: "auto",
                height: 600,
              }}
              bounds="window"
              dragHandleClassName="modal-drag-handle"
              enableResizing={true}
              style={{ zIndex: 1000 }}
            >
              <div
                style={{
                  background: "#fff",
                  padding: "1rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  borderRadius: "8px",
                  height: "100%",
                  width: "100%",
                  overflow: "auto",
                  maxHeight: "90vh",
                }}
              >
                <div
                  className="modal-drag-handle"
                  style={{ marginBottom: "8px" }}
                >
                  <h5 style={{ margin: 0 }}>Image Viewer</h5>
                </div>

                <button
                  onClick={closeImageViewer}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 1001,
                    border: "none",
                    background: "transparent",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                  }}
                >
                  ✖
                </button>

                <ZoomViewer
                  currentImage={currentImage}
                  baseUrl={baseUrl}
                  focusBox={obj}
                  templateData={templateData}
                />
              </div>
            </Rnd>
          )}

          <div>
            <Button
              className="mt-2"
              color={"info"}
              disabled={isRefreshing || scanning}
              onClick={handleRefreshData}
            >
              Refresh Data
            </Button>

            {/* <Button
              className="mt-2"
              color="success"
              disabled={isRefreshing || scanning}
              onClick={() => gridRef.current.excelExport()}
            >
              Save
            </Button> */}

            <div className="m-2" style={{ float: "right" }}>
              <Button
                color="success"
                onClick={debouncedStart}
                disabled={starting || scanning}
              >
                {starting ? "Starting…" : scanning ? "Scanning" : "Start"}
              </Button>

              {scanning && !isPaused && (
                <Button color="warning" onClick={debouncedPause}>
                  Pause
                </Button>
              )}

              {scanning && isPaused && (
                <Button color="info" onClick={debouncedResume}>
                  Resume
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>

      <div
        style={{
          position: "absolute",
          top: "100%",
          right: "40%",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "center",
            pointerEvents: scanning ? "none" : "auto",
            opacity: scanning ? 0.5 : 1,
          }}
        >
          <RecognizationBtn
            handleBtnClick={() => {
              setShowRecognizationModal(true);
            }}
          />
        </div>
      </div>

      <RecognizationModal
        show={showRecognizationModal}
        onClose={() => {
          setShowRecognizationModal(false);
        }}
      />
    </>
  );
};

export default AdminScanJob;
