"use client";

import { useEffect, useCallback, useState } from "react";
import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: AlertType;
  title?: string;
}

const alertConfig: Record<AlertType, { icon: typeof CheckCircle; colorClass: string; defaultTitle: string }> = {
  success: {
    icon: CheckCircle,
    colorClass: "text-green-500",
    defaultTitle: "Success",
  },
  error: {
    icon: XCircle,
    colorClass: "text-red-500",
    defaultTitle: "Error",
  },
  warning: {
    icon: AlertTriangle,
    colorClass: "text-yellow-500",
    defaultTitle: "Warning",
  },
  info: {
    icon: Info,
    colorClass: "text-blue-500",
    defaultTitle: "Info",
  },
};

export default function AlertModal({
  isOpen,
  onClose,
  message,
  type = "info",
  title,
}: AlertModalProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${config.colorClass}`} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title || config.defaultTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
export function useAlertModal() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    message: string;
    type: AlertType;
    title?: string;
  }>({
    isOpen: false,
    message: "",
    type: "info",
    title: undefined,
  });

  const showAlert = useCallback(
    (message: string, type: AlertType = "info", title?: string) => {
      setModalState({ isOpen: true, message, type, title });
    },
    []
  );

  const closeAlert = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    modalState,
    showAlert,
    closeAlert,
  };
}

