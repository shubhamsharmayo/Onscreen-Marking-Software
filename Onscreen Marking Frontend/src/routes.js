import MainDashboard from "views/admin/default";
import EvaluatorTasks from "views/evaluator/AllTasks/AllTasks";
import QATasks from "views/qualitycheck/AllTasks/AllTasks";
import ReviewerTasks from "views/reviewer/AllTasks/AllTasks";
import HeadEvaluatorTasks from "views/head/AllTasks/AllTasks";
import Upload from "views/admin/upload";
import Classes from "views/admin/classes";
import Profile from "views/admin/profile";
import Users from "views/admin/users";
import { FaFileUpload } from "react-icons/fa";
import { MdHome, MdPerson } from "react-icons/md";
import CreateUser from "views/admin/createUser/CreateUser";
import { IoBookSharp } from "react-icons/io5";
import CourseDetails from "views/admin/courseDetails";
import CreateSchema from "views/admin/createSchema/createSchema";
import Schema from "views/admin/schemas/Schema";
import CreateSchemaStructure from "views/admin/createSchemaStructure/createSchemaStructure";
import SelectCoordinates from "views/admin/coordinates/SelectCoordinates";
import CoordinateSelection from "views/admin/coordinates/CoordinateSelection";
import Tasks from "views/admin/tasks/Tasks";
import Template from "views/admin/Template/template";
import AssignPage from "views/admin/assignPage/AssignPage";
import { BiTask } from "react-icons/bi";
import { CiMemoPad } from "react-icons/ci";
import Booklets from "views/admin/booklets/Booklets";
import ProcessingBooklets from "views/admin/booklets/ProcessingBooklets";
import FolderStructure from "views/admin/Folder/FolderStructure";
import ResultGeneration from "views/admin/resultGenertion/ResultGeneration";
import Statistics from "views/admin/Statistics/Statistics";
import ScanPage from "views/Scanner/Scanner/ScanPage";
import AdminScanJob from "views/Scanner/Scanner/AdminScanJob";
import AdminScan from "./views/qualitycontrol/Scanner/AdminScan";
import Scannerfolder from "./views/Scanner/folder/Scannerfolder";
import ProcessBooklets from "./views/Scanner/folder/ProcessBooklets";
import {
  BookOpen,
  ClipboardList,
  Database,
  FileText,
  GraduationCap,
  LayoutDashboard,
  UserPlus,
  Users2,
  FolderClosed,
  Form,
  ScanQrCode,
} from "lucide-react";
import ScannerTasks from "./views/Scanner/Statistics/Statistics";

const routes = [
  {
    name: "Dashboard",
    layout: "/admin",
    path: "default",
    icon: <LayoutDashboard className="h-6 w-6" />,
    component: <MainDashboard />,
    hidden: false,
  },

  {
    name: "Template",
    layout: "/admin",
    path: "template",
    icon: <Form className="h-6 w-6" />,
    component: <Template />,
    hidden: false,
  },

  {
    name: "Folder",
    layout: "/admin",
    path: "folder",
    icon: <FolderClosed className="h-6 w-6" />,
    component: <FolderStructure />,
    hidden: false,
  },
  {
    name: "Schema",
    layout: "/admin",
    path: "schema",
    icon: <Database className="h-6 w-6" />,
    component: <Schema />,
    hidden: false,
  },

  {
    name: "Classes",
    layout: "/admin",
    icon: <GraduationCap className=" h-6 w-6" />,
    path: "courses",
    component: <Classes />,
    hidden: false,
  },

  {
    name: "Course Detail",
    layout: "/admin",
    icon: <IoBookSharp className="h-6 w-6" />,
    path: "classes/:id",
    component: <CourseDetails />,
    hidden: true,
  },
  {
    name: "Create Schema",
    layout: "/admin",
    icon: <IoBookSharp className=" h-6 w-6" />,
    path: "schema/create/:id",
    component: <CreateSchema />,
    hidden: true,
  },
  {
    name: "Schema Structure",
    layout: "/admin",
    icon: <IoBookSharp className=" h-6 w-6" />,
    path: "schema/create/structure/:id",
    component: <CreateSchemaStructure />,
    hidden: true,
  },

  {
    name: "Structure Coordinates",
    layout: "/admin",
    icon: <IoBookSharp className=" h-6 w-6" />,
    path: "schema/create/structure/coordinates/:id",
    component: <SelectCoordinates />,
    hidden: true,
  },
  {
    name: "Select Coordinates",
    layout: "/admin",
    icon: <IoBookSharp className=" h-6 w-6" />,
    path: "coordinates/:id",
    component: <CoordinateSelection />,
    hidden: true,
  },
  {
    name: "Profile",
    layout: "/admin",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <Profile />,
    hidden: true,
  },
  {
    name: "Users",
    layout: "/admin",
    path: "users",
    icon: <Users2 className="h-6 w-6" />,
    component: <Users />,
    hidden: false,
  },
  {
    name: "Create User",
    layout: "/admin",
    path: "createuser",
    icon: <UserPlus className="h-6 w-6" />,
    component: <CreateUser />,
    hidden: false,
  },
  {
    name: "Upload CSV File",
    layout: "/admin",
    path: "uploadcsv",
    icon: <FaFileUpload className="h-6 w-6" />,
    component: <Upload />,
    hidden: true,
  },

  {
    name: "Booklets",
    layout: "/admin",
    path: "booklets",
    icon: <BookOpen className="h-6 w-6" />,
    component: <Booklets />,
    hidden: false,
  },
  {
    name: "Tasks",
    layout: "/admin",
    path: "tasks",
    icon: <ClipboardList className="h-6 w-6" />,
    component: <Tasks />,
    hidden: false,
  },
  {
    name: "Statistics",
    layout: "/admin",
    path: "statistics",
    icon: <CiMemoPad className="h-6 w-6" />,
    component: <Statistics />,
    hidden: false,
  },
  {
    name: "Assign Tasks",
    layout: "/admin",
    path: "subjects/:id",
    icon: <BiTask className="h-6 w-6" />,
    component: <AssignPage />,
    hidden: true,
  },

  {
    name: "Process Booklets",
    layout: "/admin",
    path: "process/booklets/:classId",
    icon: <BiTask className="h-6 w-6" />,
    component: <ProcessingBooklets />,
    hidden: true,
  },

  {
    name: "Evaluator Dashboard",
    layout: "/evaluator",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
    hidden: false,
  },

  {
    name: "Deputy Head Dashboard",
    layout: "/reviewer",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
    hidden: false,
  },

  {
    name: "Head Evaluator Dashboard",
    layout: "/headevaluator",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
    hidden: false,
  },

  {
    name: "Quality Check Dashboard",
    layout: "/qualitycheck",
    path: "default",
    icon: <MdHome className="mb-3 h-6 w-6" />,
    component: <MainDashboard />,
    hidden: false,
  },

  {
    name: "Assigned Tasks",
    layout: "/evaluator",
    path: "assignedtasks",
    icon: <BiTask className="h-6 w-6" />,
    component: <EvaluatorTasks />,
    hidden: false,
  },

  {
    name: "Reviewer Tasks",
    layout: "/reviewer",
    path: "assignedtasks",
    icon: <BiTask className="h-6 w-6" />,
    component: <ReviewerTasks />,
    hidden: false,
  },

  {
    name: "Head Evaluator Tasks",
    layout: "/headevaluator",
    path: "assignedtasks",
    icon: <BiTask className="h-6 w-6" />,
    component: <HeadEvaluatorTasks />,
    hidden: false,
  },

  {
    name: "Quality Check Tasks",
    layout: "/qualitycheck",
    path: "assignedtasks",
    icon: <BiTask className="mb-3 h-6 w-6" />,
    component: <QATasks />,
    hidden: false,
  },

  {
    name: "Generate Result",
    layout: "/admin",
    path: "resultgeneration",
    icon: <FileText className="h-6 w-6" />,
    component: <ResultGeneration />,
    hidden: false,
  },

  {
    name: "Scanner Dashboard",
    layout: "/modulater",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
    hidden: false,
  },
  {
    name: "Scanner Tasks",
    layout: "/modulater",
    path: "scanner",
    icon: <CiMemoPad className="h-6 w-6" />,
    component: <ScannerTasks />,
    hidden: false,
  },
  {
    name: "Scanner folder",
    layout: "/modulater",
    path: "scannerfolder",
    icon: <CiMemoPad className="h-6 w-6" />,
    component: <Scannerfolder />,
    hidden: false,
  },
  {
    name: "Scan Job Queue",
    layout: "/modulater",
    path: "job-queue/adminscanjob",
    icon: <ScanQrCode className="h-6 w-6" />,
    component: <AdminScanJob />, // or your actual JobQueue component
    hidden: true,
  },

  {
    name: "Process ScanBooklets",
    layout: "/modulater",
    path: "process/booklets/:classId",
    icon: <BiTask className="h-6 w-6" />,
    component: <ProcessBooklets />,
    hidden: true,
  },
];

export default routes;
