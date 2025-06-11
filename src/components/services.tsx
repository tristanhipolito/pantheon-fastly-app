"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";

interface FastlyService {
  id: string;
  name: string;
  active_version?: number;
  updated_at?: string;
}

interface FastlyACL {
  id: string;
  name: string;
}

export default function BulkIPUpload() {
  // Service states
  const [services, setServices] = useState<FastlyService[]>([]);
  const [filteredServices, setFilteredServices] = useState<FastlyService[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedService, setSelectedService] = useState<FastlyService | null>(null);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  
  // ACL states
  const [acls, setAcls] = useState<FastlyACL[]>([]);
  const [filteredAcls, setFilteredAcls] = useState<FastlyACL[]>([]);
  const [aclSearch, setAclSearch] = useState("");
  const [selectedAcl, setSelectedAcl] = useState<FastlyACL | null>(null);
  const [isAclDropdownOpen, setIsAclDropdownOpen] = useState(false);
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Loading and feedback states
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingAcls, setLoadingAcls] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/fastly");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const apiData = await response.json();
        const mappedServices = (apiData.services || [])
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            active_version: item.environments?.find((env: any) => env.name === "production")?.active_version,
            updated_at: item.updated_at,
          }))
          .sort((a: FastlyService, b: FastlyService) => a.name.localeCompare(b.name));

        setServices(mappedServices);
        setFilteredServices(mappedServices);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Filter services based on search
  useEffect(() => {
    setFilteredServices(
      services.filter(service => 
        service.name.toLowerCase().includes(serviceSearch.toLowerCase())
      )
    );
  }, [serviceSearch, services]);

  // Filter ACLs based on search
  useEffect(() => {
    setFilteredAcls(
      acls.filter(acl => 
        acl.name.toLowerCase().includes(aclSearch.toLowerCase())
      )
    );
  }, [aclSearch, acls]);

  // Fetch ACLs when service is selected
  useEffect(() => {
    if (selectedService && selectedService.active_version) {
      setLoadingAcls(true);
      fetch(`/api/fastly/service/${selectedService.id}/version/${selectedService.active_version}/acl`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
          setAcls(data.acls || []);
          setFilteredAcls(data.acls || []);
        })
        .catch(err => setError("Failed to load ACLs"))
        .finally(() => setLoadingAcls(false));
    } else {
      setAcls([]);
      setFilteredAcls([]);
    }
    setSelectedAcl(null);
    setAclSearch("");
  }, [selectedService]);

  const handleServiceSelect = (service: FastlyService) => {
    setSelectedService(service);
    setServiceSearch(service.name);
    setIsServiceDropdownOpen(false);
  };

  const handleAclSelect = (acl: FastlyACL) => {
    setSelectedAcl(acl);
    setAclSearch(acl.name);
    setIsAclDropdownOpen(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setComment("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedAcl || !selectedFile) {
      setError("Please select a service, ACL, and upload a file");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("comment", comment);
      formData.append("serviceId", selectedService.id);
      formData.append("aclId", selectedAcl.id);

      const response = await fetch("/api/fastly/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 
          `Upload failed with status ${response.status}`
        );
      }

      // Analyze results
      const failedEntries = result.results.filter((r: any) => !r.ok || r.status === 'invalid');
      
      if (failedEntries.length > 0) {
        setSuccess(`Processed ${result.processed} IPs with ${failedEntries.length} failures`);
        setError(`Failed entries: ${
          failedEntries
            .slice(0, 5) // Show first 5 failures
            .map((f: any) => `${f.ip}${f.error ? ` (${f.error})` : ''}`)
            .join(', ')
        }${failedEntries.length > 5 ? '...' : ''}`);
      } else {
        setSuccess(`Successfully processed all ${result.processed} IP addresses!`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
      resetForm();
    }
  };
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Bulk IP Upload to Fastly</h2>
      
      {/* Service Selector */}
      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-gray-800">1. Select Service</label>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <input
            type="text"
            placeholder="Search services..."
            value={selectedService ? selectedService.name : serviceSearch}
            onChange={(e) => {
              setServiceSearch(e.target.value);
              setSelectedService(null);
              setIsServiceDropdownOpen(true);
            }}
            onFocus={() => setIsServiceDropdownOpen(true)}
            className="w-full p-2 text-gray-800 border-none focus:ring-0"
          />
          {selectedService && (
            <button
              onClick={() => {
                setSelectedService(null);
                setServiceSearch("");
              }}
              className="px-3 text-gray-600 hover:text-gray-800"
            >
              ×
            </button>
          )}
        </div>

        {isServiceDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {loadingServices ? (
              <div className="p-2 text-center text-gray-600">Loading services...</div>
            ) : error ? (
              <div className="p-2 text-center text-red-600">{error}</div>
            ) : filteredServices.length === 0 ? (
              <div className="p-2 text-center text-gray-600">No services found</div>
            ) : (
              <ul>
                {filteredServices.map((service) => (
                  <li
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="p-2 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{service.name}</span>
                      {service.active_version && (
                        <span className="text-sm text-gray-600">
                          v{service.active_version}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ACL Selector - Only shown when service is selected */}
      {selectedService && (
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-800">2. Select ACL</label>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <input
              type="text"
              placeholder="Search ACLs..."
              value={selectedAcl ? selectedAcl.name : aclSearch}
              onChange={(e) => {
                setAclSearch(e.target.value);
                setSelectedAcl(null);
                setIsAclDropdownOpen(true);
              }}
              onFocus={() => setIsAclDropdownOpen(true)}
              className="w-full p-2 text-gray-800 border-none focus:ring-0"
              disabled={!selectedService}
            />
            {selectedAcl && (
              <button
                onClick={() => {
                  setSelectedAcl(null);
                  setAclSearch("");
                }}
                className="px-3 text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            )}
          </div>

          {isAclDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {loadingAcls ? (
                <div className="p-2 text-center text-gray-600">Loading ACLs...</div>
              ) : error ? (
                <div className="p-2 text-center text-red-600">{error}</div>
              ) : filteredAcls.length === 0 ? (
                <div className="p-2 text-center text-gray-600">No ACLs found</div>
              ) : (
                <ul>
                  {filteredAcls.map((acl) => (
                    <li
                      key={acl.id}
                      onClick={() => handleAclSelect(acl)}
                      className="p-2 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <span className="font-medium text-gray-800">{acl.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* File Upload - Only shown when ACL is selected */}
      {selectedAcl && (
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">3. Upload IP List</label>
          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.csv"
              className="block w-full text-sm text-gray-800
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Upload a text or CSV file with one IP address per line
          </p>
          {selectedFile && (
            <p className="mt-1 text-sm text-gray-800">
              Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
        </div>
      )}

      {/* Comment Input - Only shown when file is selected */}
      {selectedFile && (
        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-1 text-gray-800">
            4. Add Comment (Optional)
          </label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            placeholder="Describe these IP addresses (e.g., 'Customer IPs for May 2023')"
          />
        </div>
      )}

      {/* Submit Button - Only shown when all required fields are complete */}
      {selectedService && selectedAcl && selectedFile && (
        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded-lg font-medium ${
              isSubmitting
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Uploading..." : "Upload IP Addresses"}
          </button>
        </div>
      )}

      {/* Feedback messages */}
      {error && (
        <div className="relative p-3 mt-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
          <div className="pr-6">{error}</div>
          <button
            onClick={() => setError(null)}
            className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
            aria-label="Dismiss error"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {success && (
        <div className="relative p-3 mt-4 text-sm text-green-700 bg-green-50 rounded-lg border border-green-100">
          <div className="pr-6">{success}</div>
          <button
            onClick={() => setSuccess(null)}
            className="absolute top-2 right-2 p-1 text-green-500 hover:text-green-700 rounded-full hover:bg-green-100 transition-colors"
            aria-label="Dismiss success message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}