import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MapPin, IndianRupee, Building2, Bookmark, Search, CheckCircle2, X, Upload, Loader2, AlertTriangle, Calendar, ExternalLink } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatusBadge } from "@/components/wag/primitives";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Job {
  id: number;
  role: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  category: string;
  posted_date: string;
  logo_letter: string;
  applicants: number;
  desc: string;
}

export const Route = createFileRoute("/dashboard/jobs")({
  component: MemberJobsPage,
});

function MemberJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);
  const [appStatuses, setAppStatuses] = useState<Record<number, string>>({});
  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [tab, setTab] = useState<"All" | "Applied" | "Saved">("All");

  // Application Modal state
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    altMobile: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    
    occupation: "",
    company: "",
    experience: "",
    relevantExperience: "",
    currentSalary: "",
    expectedSalary: "",
    noticePeriod: "",
    qualification: "",
    skills: "",
    
    coverLetter: "",
    portfolio: "",
    linkedin: "",
    github: "",
    
    whyInterested: "",
    willingToRelocate: false,
    joiningDate: "",
    memberId: "",
    communityId: ""
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Fetch jobs and job applications from backend
  const loadData = async () => {
    try {
      const commId = user?.communityId;
      const ancestors = commId ? await api.getAncestorCommunityIds(commId) : [];
      const filterQuery = ancestors.join(",");
      
      const jobsData = await api.getJobs({ community_id: filterQuery });
      setJobs(jobsData || []);
      
      const apps = await api.getJobApplications();
      const ids = (apps || []).map((app: any) => Number(app.job));
      setAppliedJobIds(ids);

      const statusMap: Record<number, string> = {};
      (apps || []).forEach((app: any) => {
        statusMap[Number(app.job)] = app.status;
      });
      setAppStatuses(statusMap);
    } catch (error) {
      console.error("Failed to load jobs or applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("wag_saved_jobs") || "[]");
    setSavedJobIds(saved);
    setLoading(true);
    loadData();
  }, []);

  // Prefill member profile details when applyingJob is selected
  useEffect(() => {
    if (applyingJob) {
      setValidationError("");
      setResumeFile(null);
      const prefill = async () => {
        try {
          const freshUser = await api.getCurrentUser();
          if (freshUser && freshUser.member) {
            const m = freshUser.member;
            
            // Address fallback helper
            const addressParts = [m.village, m.taluka, m.district].filter(Boolean);
            const addressVal = addressParts.length > 0 ? addressParts.join(", ") : (m.address || "");

            setFormData({
              fullName: m.name || "",
              email: m.email || freshUser.email || "",
              mobile: m.phone || "",
              altMobile: "",
              address: addressVal,
              city: m.taluka || m.village || "",
              state: m.state || "Gujarat",
              country: "India",
              occupation: m.job_title || m.profession || "",
              company: m.company || "",
              experience: "",
              relevantExperience: "",
              currentSalary: m.salary || "",
              expectedSalary: "",
              noticePeriod: "",
              qualification: m.degree || m.education || "",
              skills: m.field_of_study || "",
              coverLetter: "",
              portfolio: "",
              linkedin: "",
              github: "",
              whyInterested: "",
              willingToRelocate: false,
              joiningDate: "",
              memberId: String(m.id || freshUser.id),
              communityId: String(m.community || freshUser.communityId || "")
            });
          }
        } catch (e) {
          console.error("Failed to prefill member data:", e);
        }
      };
      prefill();
    }
  }, [applyingJob]);

  // Unique locations and types for filters
  const locations = ["All", ...Array.from(new Set(jobs.map(j => j.location)))];
  const types = ["All", ...Array.from(new Set(jobs.map(j => j.type)))];

  const handleApplyClick = (job: Job) => {
    if (appliedJobIds.includes(job.id)) return;
    setApplyingJob(job);
  };

  const validate = () => {
    if (!formData.fullName.trim()) return "Full Name is required.";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return "A valid email is required.";
    if (!formData.mobile.trim() || !/^\+?[0-9]{10,15}$/.test(formData.mobile.replace(/\s+/g, ""))) return "A valid phone number is required.";
    if (!formData.address.trim()) return "Current Address is required.";
    if (!formData.city.trim()) return "City is required.";
    if (!formData.state.trim()) return "State is required.";
    if (!formData.country.trim()) return "Country is required.";
    
    if (!formData.occupation.trim()) return "Current Occupation is required.";
    if (!formData.experience.trim()) return "Total Experience is required.";
    if (!formData.qualification.trim()) return "Highest Qualification is required.";
    if (!formData.skills.trim()) return "Skills field is required.";
    
    if (!resumeFile) return "Resume / CV upload is required.";
    const allowedExtensions = ["pdf", "doc", "docx"];
    const ext = resumeFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return "Resume must be a PDF, DOC, or DOCX document.";
    }
    if (resumeFile.size > 10 * 1024 * 1024) {
      return "Resume file size exceeds the 10MB limit.";
    }
    
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError("");
    setSubmitting(true);
    
    try {
      if (!applyingJob) return;
      const data = new FormData();
      data.append("job", String(applyingJob.id));
      if (formData.memberId) data.append("member", formData.memberId);
      if (formData.communityId) data.append("community", formData.communityId);
      data.append("full_name", formData.fullName);
      data.append("email", formData.email);
      data.append("mobile", formData.mobile);
      data.append("alt_mobile", formData.altMobile);
      data.append("address", formData.address);
      data.append("city", formData.city);
      data.append("state", formData.state);
      data.append("country", formData.country);
      data.append("occupation", formData.occupation);
      data.append("company", formData.company);
      data.append("experience", formData.experience);
      data.append("relevant_experience", formData.relevantExperience);
      data.append("current_salary", formData.currentSalary);
      data.append("expected_salary", formData.expectedSalary);
      data.append("notice_period", formData.noticePeriod);
      data.append("qualification", formData.qualification);
      data.append("skills", formData.skills);
      if (resumeFile) {
        data.append("resume", resumeFile);
      }
      data.append("cover_letter", formData.coverLetter);
      data.append("portfolio", formData.portfolio);
      data.append("linkedin", formData.linkedin);
      data.append("github", formData.github);
      data.append("why_interested", formData.whyInterested);
      data.append("willing_to_relocate", String(formData.willingToRelocate));
      data.append("available_joining_date", formData.joiningDate);
      
      await api.createJobApplication(data);
      
      // Update local state instantly
      const updatedApplied = [...appliedJobIds, applyingJob.id];
      setAppliedJobIds(updatedApplied);
      setAppStatuses(prev => ({ ...prev, [applyingJob!.id]: "Applied" }));
      
      setJobs(prevJobs => 
        prevJobs.map(j => j.id === applyingJob.id ? { ...j, applicants: j.applicants + 1 } : j)
      );
      
      // Close Modal & Show Success
      setApplyingJob(null);
      setResumeFile(null);
      alert("Application submitted successfully!");
    } catch (error: any) {
      console.error(error);
      setValidationError(error.message || "Failed to submit job application.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSave = (jobId: number) => {
    let updatedSaved;
    if (savedJobIds.includes(jobId)) {
      updatedSaved = savedJobIds.filter(id => id !== jobId);
    } else {
      updatedSaved = [...savedJobIds, jobId];
    }
    setSavedJobIds(updatedSaved);
    localStorage.setItem("wag_saved_jobs", JSON.stringify(updatedSaved));
  };

  // Filtering logic
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = (j.role || "").toLowerCase().includes(search.toLowerCase()) || 
                          (j.company || "").toLowerCase().includes(search.toLowerCase()) ||
                          (j.desc || "").toLowerCase().includes(search.toLowerCase());
    const matchesLocation = selectedLocation === "All" || j.location === selectedLocation;
    const matchesType = selectedType === "All" || j.type === selectedType;
    
    if (tab === "Applied") {
      return matchesSearch && matchesLocation && matchesType && appliedJobIds.includes(j.id);
    }
    if (tab === "Saved") {
      return matchesSearch && matchesLocation && matchesType && savedJobIds.includes(j.id);
    }
    return matchesSearch && matchesLocation && matchesType;
  });

  return (
    <PageWrap title="Job Portal" desc="Explore premium career opportunities in our community">
      <div className="flex gap-2 border-b border-warm mb-6">
        {(["All", "Applied", "Saved"] as const).map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              tab === t ? "border-primary text-primary font-semibold" : "border-transparent text-warm-muted"
            }`}
          >
            {t === "Applied" ? "Applied Jobs" : t === "Saved" ? "Saved Jobs" : "All Jobs"}
            {t === "Applied" && ` (${appliedJobIds.length})`} 
            {t === "Saved" && ` (${savedJobIds.length})`}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-warm-muted" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, company, or description..." 
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
          />
        </div>
        <select 
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Locations</option>
          {locations.filter(l => l !== "All").map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Job Types</option>
          {types.filter(t => t !== "All").map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-warm-muted">Loading premium career opportunities...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-warm-muted">No jobs match your selection.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredJobs.map(j => (
            <AnimatedCard key={j.id} className="p-5 relative overflow-hidden transition-all hover:shadow-md">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {j.logo_letter || j.role[0] || "J"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-ui font-semibold text-lg text-foreground leading-snug">{j.role}</h3>
                  <div className="text-xs text-warm-muted flex items-center gap-1 mt-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="font-medium">{j.company}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-warm-muted">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-accent" />{j.location}</span>
                    <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-primary" />{j.salary}</span>
                    <StatusBadge status="Open" />
                  </div>
                  <p className="text-xs text-warm-muted mt-3 line-clamp-3 leading-relaxed">{j.desc}</p>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-warm/40">
                    <span className="text-xs text-warm-muted font-medium">
                      {j.applicants} applicant{j.applicants !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleSave(j.id)}
                        className={`p-2 rounded-lg border transition-all ${
                          savedJobIds.includes(j.id) 
                            ? "border-accent bg-accent/10 text-accent" 
                            : "border-warm hover:bg-surface-hover text-warm-muted"
                        }`}
                        title={savedJobIds.includes(j.id) ? "Remove Bookmark" : "Bookmark Job"}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                      {appliedJobIds.includes(j.id) ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            appStatuses[j.id] === "Selected" ? "bg-green-50 text-green-600 border-green-200" :
                            appStatuses[j.id] === "Rejected" ? "bg-red-50 text-red-600 border-red-200" :
                            appStatuses[j.id] === "Shortlisted" ? "bg-purple-50 text-purple-600 border-purple-200" :
                            appStatuses[j.id] === "Interview Scheduled" ? "bg-orange-50 text-orange-600 border-orange-200" :
                            appStatuses[j.id] === "Under Review" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                            "bg-blue-50 text-blue-600 border-blue-200"
                          }`}>
                            {appStatuses[j.id] || "Applied"}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Applied ✓
                          </span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleApplyClick(j)}
                          className="px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1 transition-all bg-primary hover:bg-primary-hover text-white hover:shadow-sm"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {/* Modern Job Application Modal/Popup */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-warm flex flex-col my-8 max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-sand p-6 border-b border-warm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                  Job Application
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Apply for Job</h2>
                
                {/* Short Job Info summary card inside header */}
                <div className="mt-3 p-3 bg-white rounded-xl border border-warm flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  <span className="font-bold text-slate-800 text-sm block w-full">{applyingJob.role} at {applyingJob.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-accent" /> {applyingJob.location}</span>
                  <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-primary" /> {applyingJob.salary}</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-warm-muted" /> {applyingJob.type}</span>
                </div>
              </div>
              <button 
                onClick={() => setApplyingJob(null)}
                className="p-1.5 rounded-lg hover:bg-warm/50 text-slate-500 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-xs text-red-600 items-start">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Please correct the error:</strong>
                    <p className="mt-1">{validationError}</p>
                  </div>
                </div>
              )}

              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-warm pb-1.5">
                  1. Personal Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input 
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input 
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                    <input 
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Mobile Number</label>
                    <input 
                      type="tel"
                      value={formData.altMobile}
                      onChange={(e) => setFormData(prev => ({ ...prev, altMobile: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Address *</label>
                    <textarea 
                      required
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                    <input 
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                    <input 
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Country *</label>
                    <input 
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-warm pb-1.5">
                  2. Professional Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Occupation *</label>
                    <input 
                      type="text"
                      required
                      value={formData.occupation}
                      onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                      placeholder="e.g. Software Engineer, Student"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Company</label>
                    <input 
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Total Experience *</label>
                    <input 
                      type="text"
                      required
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="e.g. 2 Years, Fresher"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Relevant Experience</label>
                    <input 
                      type="text"
                      value={formData.relevantExperience}
                      onChange={(e) => setFormData(prev => ({ ...prev, relevantExperience: e.target.value }))}
                      placeholder="e.g. 1.5 Years"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Salary</label>
                    <input 
                      type="text"
                      value={formData.currentSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentSalary: e.target.value }))}
                      placeholder="e.g. 6 LPA"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Salary</label>
                    <input 
                      type="text"
                      value={formData.expectedSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                      placeholder="e.g. 8 LPA"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Period</label>
                    <input 
                      type="text"
                      value={formData.noticePeriod}
                      onChange={(e) => setFormData(prev => ({ ...prev, noticePeriod: e.target.value }))}
                      placeholder="e.g. Immediate, 30 Days"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Highest Qualification *</label>
                    <input 
                      type="text"
                      required
                      value={formData.qualification}
                      onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                      placeholder="e.g. B.Tech in CSE, MCA"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Skills (Comma separated) *</label>
                    <input 
                      type="text"
                      required
                      value={formData.skills}
                      onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                      placeholder="e.g. React, Node.js, Python, CSS"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Documents & Links */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-warm pb-1.5">
                  3. Documents & Links
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Resume / CV Upload * (PDF, DOC, DOCX - Max 10MB)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-warm rounded-xl bg-sand/20 hover:bg-sand/35 transition cursor-pointer relative">
                      <input 
                        type="file"
                        required
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setResumeFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="space-y-1 text-center pointer-events-none">
                        <Upload className="mx-auto h-8 w-8 text-warm-muted" />
                        <div className="flex text-xs text-slate-600 justify-center">
                          <span className="font-semibold text-primary">Upload a file</span>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-[10px] text-warm-muted">PDF, DOC, DOCX up to 10MB</p>
                        {resumeFile && (
                          <div className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">
                            Selected: {resumeFile.name} ({(resumeFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Letter (Optional)</label>
                    <textarea 
                      rows={3}
                      value={formData.coverLetter}
                      onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                      placeholder="Why should we hire you for this role?..."
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio URL</label>
                    <input 
                      type="url"
                      value={formData.portfolio}
                      onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                      placeholder="https://myportfolio.com"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
                    <input 
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Github URL (Optional)</label>
                    <input 
                      type="url"
                      value={formData.github}
                      onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Questions */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-warm pb-1.5">
                  4. Additional Questions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Why are you interested in this position?</label>
                    <textarea 
                      rows={2}
                      value={formData.whyInterested}
                      onChange={(e) => setFormData(prev => ({ ...prev, whyInterested: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2 sm:col-span-1">
                    <input 
                      type="checkbox"
                      id="willingToRelocate"
                      checked={formData.willingToRelocate}
                      onChange={(e) => setFormData(prev => ({ ...prev, willingToRelocate: e.target.checked }))}
                      className="w-4 h-4 rounded border-warm text-primary focus:ring-primary"
                    />
                    <label htmlFor="willingToRelocate" className="text-xs font-semibold text-slate-700">Are you willing to relocate?</label>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Available Joining Date</label>
                    <input 
                      type="text"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                      placeholder="e.g. Immediate, 1st July 2026"
                      className="w-full px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-4 bg-sand border-t border-warm flex gap-2 justify-end">
              <button 
                type="button"
                onClick={() => setApplyingJob(null)}
                className="px-4 py-2 rounded-xl border border-warm hover:bg-warm/30 text-xs font-bold transition text-slate-600"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition flex items-center gap-1.5 hover:shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrap>
  );
}
