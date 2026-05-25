import React from "react";

const ConfirmationModal = ({
  confirmationModal,
  onSubmitHandler,
  setConfirmationModal,
  heading,
  message,
  type,
  setId,
}) => {
  const typeStyles = {
    success: {
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      buttonBg: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    },
    warning: {
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      buttonBg: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    },
    error: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      buttonBg: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    },
  };

  const styles = typeStyles[type] || typeStyles.success;

  return (
    <div>
      {confirmationModal && (
        <div className="bg-black/40 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-navy-700">
            <div className="px-5 py-4">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.iconBg}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className={`h-5 w-5 ${styles.iconColor}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {heading}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 pb-4">
              <button
                onClick={onSubmitHandler}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white ${styles.buttonBg}`}
              >
                OK
              </button>

              <button
                onClick={() => {
                  setConfirmationModal(false);
                  setId("");
                }}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmationModal;
