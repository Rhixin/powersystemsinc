"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  ChevronLeftIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  FunnelIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";
import { formRecordService, companyFormService } from "@/services";
import { CompanyForm } from "@/types";
import toast from "react-hot-toast";
import apiClient from "@/lib/axios";
import { TableSkeleton } from "@/components/Skeletons";
import ConfirmationModal from "@/components/ConfirmationModal";

interface FormRecord {
  id: string;
  companyFormId: number;
  job_order?: string;
  data: Record<string, any>;
  dateCreated: string;
  dateUpdated: string;
  companyForm: {
    id: string;
    name: string;
    formType: string;
  };
}

function RecordsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formTemplates, setFormTemplates] = useState<CompanyForm[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CompanyForm | null>(null);
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<FormRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<FormRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [editJobOrder, setEditJobOrder] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Date range filter state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Fetch form templates on mount
  useEffect(() => {
    loadFormTemplates();
  }, []);

  // Handle URL query parameter for folder ID
  useEffect(() => {
    const folderId = searchParams.get("id");

    if (!folderId) {
      if (selectedTemplate) {
        setSelectedTemplate(null);
        setRecords([]);
      }
      return;
    }

    if (formTemplates.length === 0) return;

    const template = formTemplates.find((t) => String(t.id) === String(folderId));

    if (template) {
      if (!selectedTemplate || String(selectedTemplate.id) !== String(template.id)) {
        setSelectedTemplate(template);
        loadRecordsForTemplate(template.id);
      }
    }
  }, [searchParams, formTemplates.length]);

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

  const loadRecordsForTemplate = async (templateId: string) => {
    try {
      setIsLoadingRecords(true);
      const response = await apiClient.get(`/forms?companyFormId=${templateId}`);
      const recordsData = response.data?.data || response.data;
      setRecords(Array.isArray(recordsData) ? recordsData : []);
    } catch (error) {
      console.error("Error loading records:", error);
      toast.error("Failed to load form records");
      setRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleFolderClick = (template: CompanyForm) => {
    router.push(`/dashboard/records/folders?id=${template.id}`);
  };

  const handleBackToFolders = () => {
    router.push("/dashboard/records/folders");
    setSearchTerm("");
  };

  const handleExportPDF = async (recordId: string) => {
    try {
      const loadingToast = toast.loading("Generating PDF...");
      const response = await apiClient.get(`/pdf/report/${recordId}`, {
        responseType: "blob",
      });
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL);
      toast.success("PDF generated successfully!", { id: loadingToast });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleOpenEditModal = (record: FormRecord) => {
    setEditingRecord(record);
    setEditFormData(record.data);
    setEditJobOrder(record.job_order || "");
  };

  const handleCloseEditModal = () => {
    setEditingRecord(null);
    setEditFormData({});
    setEditJobOrder("");
  };

  const handleRequestSave = () => {
    setShowSaveConfirm(true);
  };

  const confirmSaveEdit = async () => {
    if (!editingRecord) return;
    setIsSaving(true);
    try {
      const loadingToast = toast.loading("Saving changes...");
      await formRecordService.update(editingRecord.id, {
        jobOrder: editJobOrder,
        companyFormId: editingRecord.companyFormId,
        data: editFormData,
      });
      toast.success("Form updated successfully!", { id: loadingToast });
      if (selectedTemplate) {
        await loadRecordsForTemplate(selectedTemplate.id);
      }
      handleCloseEditModal();
    } catch (error) {
      console.error("Error updating form:", error);
      toast.error("Failed to update form");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (sectionKey: string, fieldKey: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        [fieldKey]: value,
      },
    }));
  };

  const getJobOrder = (record: FormRecord): string => {
    if (record.job_order) return record.job_order;
    return "N/A";
  };

  const getCustomer = (record: FormRecord): string => {
    const basicInfo = record.data?.basicInformation;
    if (basicInfo) {
      return basicInfo.customer || basicInfo.customerName || basicInfo.name || "N/A";
    }
    return "N/A";
  };

  const getSerialNo = (record: FormRecord): string => {
    const engineInfo = record.data?.engineInformation;
    if (engineInfo) {
      return engineInfo.engineSerialNo || engineInfo.serialNo || "N/A";
    }
    return "N/A";
  };

  const filteredRecords = records.filter((record) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const jobOrder = getJobOrder(record);
      const customer = getCustomer(record);
      const serialNo = getSerialNo(record);
      const jobOrderMatches = jobOrder !== "N/A" && jobOrder.toLowerCase().includes(searchLower);
      const customerMatches = customer !== "N/A" && customer.toLowerCase().includes(searchLower);
      const serialMatches = serialNo !== "N/A" && serialNo.toLowerCase().includes(searchLower);
      if (!jobOrderMatches && !customerMatches && !serialMatches) return false;
    }
    if (startDate || endDate) {
      const recordDate = new Date(record.dateCreated);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (recordDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (recordDate > end) return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedTemplate && (
            <button
              onClick={handleBackToFolders}
              className="p-2 text-gray-500 hover:text-[#2B4C7E] hover:bg-blue-50 rounded-full transition-colors"
              title="Back to Folders"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {selectedTemplate ? selectedTemplate.name : "Form Records"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedTemplate 
                ? "View and manage submitted records for this template." 
                : "Select a form template to view its records."}
            </p>
          </div>
        </div>
        {selectedTemplate && (
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 text-sm text-gray-600">
            Total Records: <span className="font-bold text-[#2B4C7E]">{records.length}</span>
          </div>
        )}
      </div>

      {/* Folders View */}
      {!selectedTemplate && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 h-40 animate-pulse border border-gray-100"></div>
              ))}
            </div>
          ) : formTemplates.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
              <FolderIcon className="h-20 w-20 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Templates Found</h3>
              <p className="text-gray-500 mt-2">Create a form template to start collecting records.</p>
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
                  <p className="text-sm text-gray-500">
                    View records &rarr;
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Records Table View */}
      {selectedTemplate && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slideUp">
          {/* Toolbar */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by Job Order, Customer, or Serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200">
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-3 pr-2 py-1.5 text-sm border-none focus:ring-0 bg-transparent text-gray-600"
                  />
                </div>
                <span className="text-gray-300">|</span>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-2 pr-3 py-1.5 text-sm border-none focus:ring-0 bg-transparent text-gray-600"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Clear dates"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoadingRecords ? (
            <div className="p-6"><TableSkeleton rows={5} /></div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No records found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or date filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Order</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Serial No.</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getJobOrder(record)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getCustomer(record)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{getSerialNo(record)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                          {new Date(record.dateCreated).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(record)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit Record"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleExportPDF(record.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredRecords.length)}</span> of <span className="font-medium">{filteredRecords.length}</span> results
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View/Edit Modal (Shared Structure) */}
      {(selectedRecord || editingRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slideUp overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingRecord ? "Edit Record" : (selectedTemplate?.name || "Record Details")}
                </h3>
                <p className="text-sm text-gray-500">
                  {editingRecord ? `Editing Job Order: ${editJobOrder || 'N/A'}` : "View record details below."}
                </p>
              </div>
              <button 
                onClick={() => { setSelectedRecord(null); handleCloseEditModal(); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 max-w-3xl mx-auto">
                {/* Company Header (Only on View) */}
                {!editingRecord && (
                  <div className="text-center mb-8 pb-6 border-b-2 border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Power Systems, Incorporated</h1>
                    <p className="text-xs text-gray-500 mb-1">2nd Floor TOPY's Place #3 Calle Industria cor. Economia Street, Bagumbayan, Libis, Quezon City</p>
                    <p className="text-xs text-gray-500">Tel: (+63-2) 687-9275 to 78 | Email: sales@psi-deutz.com</p>
                  </div>
                )}

                {/* Fields */}
                <div className="space-y-8">
                  {Object.entries(editingRecord ? editFormData : selectedRecord?.data || {}).map(([sectionName, sectionData]) => {
                    const sectionLabel = sectionName.replace(/([A-Z])/g, " $1").trim();
                    return (
                      <div key={sectionName}>
                        <h4 className="text-sm font-bold text-[#2B4C7E] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                          {sectionLabel}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {typeof sectionData === "object" && sectionData !== null && Object.entries(sectionData).map(([fieldName, fieldValue]) => {
                            const fieldLabel = fieldName.replace(/([A-Z])/g, " $1").trim();
                            const isTextarea = String(fieldValue || "").length > 100;
                            
                            return (
                              <div key={fieldName} className={isTextarea ? "md:col-span-2" : ""}>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                  {fieldLabel}
                                </label>
                                {editingRecord ? (
                                  isTextarea ? (
                                    <textarea
                                      value={String(fieldValue || "")}
                                      onChange={(e) => handleFieldChange(sectionName, fieldName, e.target.value)}
                                      rows={4}
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={typeof fieldValue === "object" ? JSON.stringify(fieldValue) : String(fieldValue || "")}
                                      onChange={(e) => handleFieldChange(sectionName, fieldName, e.target.value)}
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                  )
                                ) : (
                                  <div className="text-sm text-gray-900 font-medium break-words">
                                    {typeof fieldValue === "object" ? JSON.stringify(fieldValue) : String(fieldValue || "-")}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button
                onClick={() => { setSelectedRecord(null); handleCloseEditModal(); }}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {editingRecord && (
                <button
                  onClick={handleRequestSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#2B4C7E] text-white rounded-xl font-medium hover:bg-[#1A2F4F] shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              )}
              {!editingRecord && selectedRecord && (
                <button
                  onClick={() => handleExportPDF(selectedRecord.id)}
                  className="flex items-center px-5 py-2.5 bg-[#2B4C7E] text-white rounded-xl font-medium hover:bg-[#1A2F4F] shadow-lg hover:shadow-xl transition-all"
                >
                  <PrinterIcon className="h-5 w-5 mr-2" />
                  Export PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={confirmSaveEdit}
        title="Save Changes"
        message="Are you sure you want to save these changes to the form record?"
        confirmText="Save Changes"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <RecordsPageContent />
    </Suspense>
  );
}
