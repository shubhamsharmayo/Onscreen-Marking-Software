import React, { useState, useMemo } from "react";

const DataContext = React.createContext();

export const DataProvider = ({ children }) => {
  const [allTemplates, setAllTemplates] = useState([]);
  const [backendIP, setBackendIP] = useState("localhost");

  const addToAllTemplate = (data) => {
    if (!Array.isArray(data)) return;
    setAllTemplates([...data]); // new reference (important)
  };

  const modifyAllTemplate = (updatedTemplate) => {
    setAllTemplates((prev) =>
      prev.map((item) =>
        item.id === updatedTemplate.id ? updatedTemplate : item
      )
    );
  };

  const deleteTemplate = (id) => {
    setAllTemplates((prev) => prev.filter((item) => item.id !== id));
  };

  const value = useMemo(
    () => ({
      allTemplates,
      backendIP,
      addToAllTemplate,
      setAllTemplates,
      modifyAllTemplate,
      deleteTemplate,
      setBackendIP,
    }),
    [allTemplates, backendIP]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
