"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CompanyForm } from "@/types";
import CompanyForms from "@/components/CompanyForms";
import FormInstances from "@/components/FormInstances";
import { companyFormService } from "@/services";
import toast from "react-hot-toast";
import { ArrowLeftIcon, DocumentPlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

function FormsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [forms, setForms] = useState<CompanyForm[]>([]);
  const [activeTab, setActiveTab] = useState<string>("create");
  const [isLoading, setIsLoading] = useState(true);

  // Load forms on mount
  useEffect(() => {
    loadForms();
  }, []);

  // Set active tab from URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(String(tabFromUrl));
    } else {
      setActiveTab("create");
    }
  }, [searchParams]);

  const loadForms = async () => {
    try {
      const response = await companyFormService.getAll();
      const formsData = response.data || [];
      setForms(Array.isArray(formsData) ? formsData : []);
    } catch (error) {
      toast.error("Failed to load forms");
      console.error("Error loading forms:", error);
      setForms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedForm = forms.find((f) => String(f.id) === activeTab);

  return (
    <div className="space-y-6">
      {/* Header / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === "create" ? "Form Templates" : selectedForm?.name || "Fill Form"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === "create"
              ? "Manage and create reusable form templates for your organization."
              : "Fill out and submit a new record for this form."}
          </p>
        </div>

        {activeTab !== "create" && (
          <button
            onClick={() => {
              setActiveTab("create");
              router.push("/dashboard/forms");
            }}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Templates
          </button>
        )}
      </div>

      {/* Mode Switcher (Only visible when in 'create' mode or to switch context) */}
      {activeTab === "create" && (
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              className="pb-4 px-1 border-b-2 border-[#2B4C7E] text-[#2B4C7E] font-medium text-sm flex items-center"
            >
              <DocumentPlusIcon className="h-5 w-5 mr-2" />
              Templates Manager
            </button>
            {/* <button
              className="pb-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center"
            >
              <PencilSquareIcon className="h-5 w-5 mr-2" />
              Fill Forms (Select from list below)
            </button> */}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="animate-fadeIn">
        {activeTab === "create" ? (
          <CompanyForms forms={forms} setForms={setForms} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             {/* Pass the selected form ID to render the form filling interface */}
            <FormInstances formId={activeTab} forms={forms} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function FormsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <FormsPageContent />
    </Suspense>
  );
}
