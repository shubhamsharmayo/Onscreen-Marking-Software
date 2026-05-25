import React, { useEffect, useState } from "react";
import axios from "axios";

const Statistics = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/rejected-booklets`
      );

      if (res.data?.success) {
        const sortedData = res.data.data.sort(
          (a, b) => new Date(b.rejectedAt) - new Date(a.rejectedAt)
        );

        setTableData(sortedData);
      }
    } catch (error) {
      console.error("Error fetching statistics", error);
      setError("Failed to load statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            Rejected Booklets
          </h1>
          <p className="text-gray-600">Overview of rejected booklet records</p>
        </div>

        {/* Total Count */}
        <div className="mb-8">
          <div className="rounded-xl border-l-4 border-blue-500 bg-white p-6 shadow-md">
            <p className="text-sm uppercase text-gray-500">Total Rejected</p>
            <p className="mt-1 text-3xl font-bold text-gray-800">
              {tableData.length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-teal-400 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">
              Rejection Details
            </h2>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="p-8 text-center text-blue-600">{error}</div>
          )}

          {/* Table Content */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                      Booklet Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                      Question
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                      Evaluator
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                      Rejected At
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {tableData.length > 0 ? (
                    tableData.map((item, index) => (
                      <tr key={index} className="transition hover:bg-red-50">
                        {/* Index */}
                        <td className="px-6 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400 text-sm font-medium text-gray-100">
                            {index + 1}
                          </span>
                        </td>

                        {/* Subject */}
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {item.subject}
                        </td>

                        <td className="px-6 py-4">{item.bookletName}</td>

                        <td className="px-6 py-4">{item.questionNumber}</td>

                        <td className="px-6 py-4 font-medium text-indigo-700">
                          {item.evaluatorName}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.rejectedAt
                            ? new Date(item.rejectedAt).toLocaleString()
                            : item.rejectedAt}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-16 text-center text-gray-500"
                      >
                        No rejected booklets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && tableData.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {tableData.length} entries
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
