"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderIcon } from "@heroicons/react/24/outline";
import { companyFormService } from "@/services";
import { CompanyForm } from "@/types";
import toast from "react-hot-toast";

export default function RecordsFoldersPage() {
  const router = useRouter();
  const [formTemplates, setFormTemplates] = useState<CompanyForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch form templates on mount
  useEffect(() => {
    loadFormTemplates();
  }, []);

  const loadFormTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await companyFormService.getAll();
      const templatesData = response.data || [];
      const templates = Array.isArray(templatesData) ? templatesData : [];
      setFormTemplates(templates);
    } catch (error) {
      console.error("Error loading form templates:", error);
      toast.error("Failed to load form templates");
      setFormTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (template: CompanyForm) => {
    // Normalize form type to lowercase for URL
    const normalizedFormType = template.formType.toLowerCase();
    router.push(`/dashboard/records/folders/${normalizedFormType}`);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Form Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Select a form template to view its records.
          </p>
        </div>
      </div>

      {/* Folders View */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-6 h-40 animate-pulse border border-gray-100"
            ></div>
          ))}
        </div>
      ) : formTemplates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <FolderIcon className="h-20 w-20 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Templates Found</h3>
          <p className="text-gray-500 mt-2">
            Create a form template to start collecting records.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {formTemplates.map((template, index) => (
            <div
              key={template.id}
              onClick={() => handleFolderClick(template)}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />

              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 text-[#2B4C7E] rounded-xl group-hover:bg-[#2B4C7E] group-hover:text-white transition-colors shadow-sm">
                  <FolderIcon className="h-8 w-8" />
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full group-hover:bg-blue-50 group-hover:text-[#2B4C7E] transition-colors">
                  {template.formType}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#2B4C7E] transition-colors line-clamp-1">
                {template.name}
              </h3>
              <p className="text-sm text-gray-500">View records &rarr;</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
