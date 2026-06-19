import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Upload,
  X,
  Building2,
  Search,
  Trash2,
  Plus,
  Check,
  FileText,
  Info,
  DollarSign,
  MapPin,
  ShieldCheck,
  Activity,
  Calendar,
  Lock,
  XCircle,
  Clock,
  ChevronDown,
  User
} from "lucide-react";
import { PageTransition, Modal, AvatarCircle } from "@/components/wag/primitives";

export const Route = createFileRoute("/register/community")({
  head: () => ({ meta: [{ title: "Register your Samaj — WE ARE UNITED" }] }),
  component: CommReg,
});

const STEPS = [
  { name: "Information", desc: "Basic details & branding" },
  { name: "Hierarchy & Account", desc: "Parent link & admin setup" },
  { name: "Committee Builder", desc: "Organisational structure" },
  { name: "Review & Documents", desc: "Confirm registration" },
  { name: "Success Timeline", desc: "Review status" }
];

interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  avatar: string;
}

const MOCK_PARENTS = [
  { id: "1", name: "Gujarat Ahir Samaj Board", state: "Gujarat", hierarchy: "Gujarat → State Apex Samaj" },
  { id: "2", name: "All India Patel Sangathan", state: "Gujarat", hierarchy: "India → National Apex Council" },
  { id: "3", name: "Mumbai Brahmin Samaj Mandal", state: "Maharashtra", hierarchy: "Maharashtra → District Body" },
  { id: "4", name: "Rajasthan Rajput Mahasabha", state: "Rajasthan", hierarchy: "Rajasthan → State Level Board" },
];

function CommReg() {
  const navigate = useNavigate();

  // Load draft states from sessionStorage if available
  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem("reg_community_step");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showParentModal, setShowParentModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(() => {
    const saved = sessionStorage.getItem("reg_community_draft");
    if (saved) {
      try {
        const d = JSON.parse(saved);
        return d.parentId || "";
      } catch (e) { }
    }
    return "";
  });
  const [dir, setDir] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [createdCommunityInfo, setCreatedCommunityInfo] = useState<any | null>(() => {
    const saved = sessionStorage.getItem("wag_registered_community");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return null;
  });

  // Store actual File objects (cannot be in sessionStorage)
  const logoFileRef = useRef<File | null>(null);
  const coverFileRef = useRef<File | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Form State
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem("reg_community_draft");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return {
      name: "",
      type: "Super" as "Super" | "Subsidiary",
      caste: "Ahir",
      subCaste: "",
      state: "Gujarat",
      district: "Amreli",
      taluka: "",
      village: "",
      email: "",
      phone: "",
      website: "",
      desc: "",
      logo: null as string | null,
      cover: null as string | null,
      registrationNo: "",
      estYear: "",
      officeAddress: "",
      visionMission: "",
      socialFb: "",
      socialTw: "",
      socialYt: "",
      adminName: "",
      adminEmail: "",
      adminPhone: "",
      adminPass: "",
      plan: "Basic" as "Free" | "Basic" | "Pro" | "Enterprise",
      parentId: "",
      parentName: "",
      parentHierarchy: "",
      docName: ""
    };
  });

  const [committee, setCommittee] = useState<CommitteeMember[]>(() => {
    const saved = sessionStorage.getItem("reg_committee");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [];
  });

  // Save changes to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("reg_community_draft", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem("reg_community_step", step.toString());
  }, [step]);

  useEffect(() => {
    sessionStorage.setItem("reg_committee", JSON.stringify(committee));
  }, [committee]);

  // SPA Navigation vs Browser Reload handler
  useEffect(() => {
    let isUnloading = false;
    const handleUnload = () => {
      isUnloading = true;
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      // If we are unmounting without a browser reload, it means the user clicked away
      // to another page in the app. Clean up draft!
      if (!isUnloading) {
        sessionStorage.removeItem("reg_community_draft");
        sessionStorage.removeItem("reg_community_step");
        sessionStorage.removeItem("reg_committee");
      }
    };
  }, []);

  const handleCancelParentSelection = () => {
    updateField("type", "Super");
    updateField("parentId", "");
    updateField("parentName", "");
    updateField("parentHierarchy", "");
    setSelectedParentId("");
    setShowParentModal(false);
  };

  const handleContinueParentSelection = (selectedParent: any) => {
    if (selectedParent) {
      updateField("type", "Subsidiary");
      updateField("parentId", selectedParent.id.toString());
      updateField("parentName", selectedParent.name);
      updateField("parentHierarchy", `${selectedParent.state} → ${selectedParent.taluka || selectedParent.district} → ${selectedParent.type} Samaj`);
    }
    setShowParentModal(false);
  };

  const updateField = (key: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: val }));
    setErrorMsg(null);
  };

  const handleNext = async () => {
    setErrorMsg(null);

    // Basic Validation
    if (step === 0) {
      if (!formData.logo) return setErrorMsg("Community Logo is required.");
      if (!formData.cover) return setErrorMsg("Community Cover Image is required.");
      if (!formData.name.trim()) return setErrorMsg("Community Name is required");
      if (!/^[a-zA-Z\s]{3,100}$/.test(formData.name.trim())) {
        return setErrorMsg("Community Name must be between 3 and 100 characters and contain only letters and spaces.");
      }
      if (!formData.caste) return setErrorMsg("Caste is required.");
      if (!formData.email.trim()) return setErrorMsg("Contact Email is required");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        return setErrorMsg("Please enter a valid contact email address.");
      }
      if (!formData.phone.trim()) return setErrorMsg("Contact Phone is required");
      if (!formData.registrationNo || !formData.registrationNo.trim()) return setErrorMsg("Registration Number is required.");
      if (!formData.estYear) return setErrorMsg("Established Year is required.");
      const currentYear = new Date().getFullYear();
      if (parseInt(formData.estYear, 10) > currentYear) {
        return setErrorMsg("Established Year cannot be in the future.");
      }
      if (!formData.officeAddress || !formData.officeAddress.trim()) return setErrorMsg("Office Address is required.");
      if (!formData.visionMission || formData.visionMission.trim().length < 20) {
        return setErrorMsg("Vision & Mission statement must be at least 20 characters.");
      }
      if (!formData.desc || formData.desc.trim().length < 50) {
        return setErrorMsg("About Community/Description must be at least 50 characters.");
      }
      if (formData.type === "Subsidiary" && !formData.parentId) {
        return setErrorMsg("Parent Community selection is required for Subsidiary communities. Please click on Subsidiary again to choose a parent.");
      }
    }
    if (step === 1) {
      if (formData.type === "Subsidiary" && !formData.parentId) {
        return setErrorMsg("Please select a Parent Community for Subsidiary registration");
      }
      if (!formData.adminName.trim()) return setErrorMsg("Admin Contact Name is required");
      if (!/^[a-zA-Z\s]{3,100}$/.test(formData.adminName.trim())) {
        return setErrorMsg("Admin Contact Name must be between 3 and 100 characters and contain only letters and spaces.");
      }
      if (!formData.adminEmail.trim()) return setErrorMsg("Admin Account Email is required");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail.trim())) {
        return setErrorMsg("Please enter a valid admin email address.");
      }
      if (!formData.adminPhone || !/^\d{10}$/.test(formData.adminPhone.trim())) {
        return setErrorMsg("Admin Phone must be exactly 10 digits.");
      }
      if (!formData.adminPass.trim()) return setErrorMsg("Admin Password is required");
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.adminPass)) {
        return setErrorMsg("Admin Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one number, and one special character.");
      }
    }
    if (step === 2) {
      if (committee.length === 0) {
        return setErrorMsg("At least 1 committee member is required to proceed.");
      }
      for (const member of committee) {
        if (!member.name.trim()) return setErrorMsg("Committee member name is required.");
        if (!member.role) return setErrorMsg(`Role is required for committee member "${member.name}".`);
        if (!member.phone || !/^\d{10}$/.test(member.phone.trim())) {
          return setErrorMsg(`Committee member "${member.name}" must have a valid 10-digit phone number.`);
        }
        if (!member.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email.trim())) {
          return setErrorMsg(`Committee member "${member.name}" must have a valid email address.`);
        }
        if (!member.avatar) {
          return setErrorMsg(`Committee member "${member.name}" must have a photo uploaded.`);
        }
      }
    }
    if (step === 3) {
      if (!formData.docName) {
        return setErrorMsg("Registration Certificate document is required.");
      }
    }

    if (step === 3) {
      setIsSubmitting(true);
      try {
        // Build FormData to support actual file uploads
        const fd = new FormData();
        fd.append("name", formData.name);
        fd.append("type", formData.type);
        if (formData.type === "Subsidiary" && formData.parentId) {
          fd.append("parent", formData.parentId);
        }
        fd.append("state", formData.state);
        fd.append("district", formData.district);
        fd.append("taluka", formData.taluka || "N/A");
        fd.append("village", formData.village || "N/A");
        fd.append("plan", formData.plan);
        fd.append("status", "Pending Super Admin Approval");
        fd.append("desc", formData.desc || "Established community registration.");
        fd.append("admin_name", formData.adminName);
        fd.append("admin_email", formData.adminEmail);
        fd.append("admin_phone", formData.adminPhone);
        fd.append("admin_password", formData.adminPass);
        if (formData.caste) fd.append("caste", formData.caste);
        if (formData.subCaste) fd.append("sub_caste", formData.subCaste);
        if (formData.email) fd.append("email", formData.email);
        if (formData.phone) fd.append("phone", formData.phone);
        if (formData.estYear) fd.append("est_year", formData.estYear);
        if (formData.registrationNo) fd.append("registration_no", formData.registrationNo);
        if (formData.officeAddress) fd.append("office_address", formData.officeAddress);
        if (formData.website) fd.append("website", formData.website);
        if (formData.visionMission) fd.append("vision_mission", formData.visionMission);
        if (formData.socialFb) fd.append("social_fb", formData.socialFb);
        if (formData.socialTw) fd.append("social_tw", formData.socialTw);
        if (formData.socialYt) fd.append("social_yt", formData.socialYt);
        if (formData.docName) fd.append("doc_name", formData.docName);

        // Attach actual File objects if the user uploaded them
        if (logoFileRef.current) {
          fd.append("logo", logoFileRef.current);
        } else if (formData.logo && !formData.logo.startsWith("blob:")) {
          fd.append("logo_url", formData.logo);
        }
        if (coverFileRef.current) {
          fd.append("cover", coverFileRef.current);
        } else if (formData.cover && !formData.cover.startsWith("blob:")) {
          fd.append("cover_url", formData.cover);
        }

        // 2. Submit community
        let createdCommunity;
        try {
          createdCommunity = await api.createCommunity(fd);
        } catch (err: any) {
          err.errorContext = "community";
          throw err;
        }

        setCreatedCommunityInfo(createdCommunity);
        sessionStorage.setItem("wag_registered_community", JSON.stringify(createdCommunity));
        const communityId = createdCommunity.id;

        // 3. Submit committee members
        for (const member of committee) {
          const committeePayload = {
            name: member.name,
            designation: member.role,
            since: new Date().toISOString().split("T")[0],
            phone: member.phone || "+91 99999 99999",
            email: member.email || "info@samaj.org",
            photo_url: (member.avatar && !member.avatar.startsWith("blob:")) ? member.avatar : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80",
            community: communityId
          };
          try {
            await api.createCommitteeMember(committeePayload);
          } catch (err: any) {
            err.errorContext = "committee";
            err.errorMemberName = member.name;
            throw err;
          }
        }

        // Clear sessionStorage since submission succeeded
        sessionStorage.removeItem("reg_community_draft");
        sessionStorage.removeItem("reg_community_step");
        sessionStorage.removeItem("reg_committee");

      } catch (err: any) {
        console.error("Submission failed: ", err);

        let displayError = err.message || "Failed to register community in the Django database. Please verify the backend API is running.";

        // Handle field-specific validation errors and redirect/focus
        if (err.errorFields && typeof err.errorFields === 'object') {
          const firstErrorKey = Object.keys(err.errorFields)[0];
          if (firstErrorKey) {
            const errorText = Array.isArray(err.errorFields[firstErrorKey])
              ? err.errorFields[firstErrorKey].join(', ')
              : err.errorFields[firstErrorKey];

            if (err.errorContext === "committee") {
              // Redirect to Step 2 (Committee Builder)
              setStep(2);
              displayError = `Committee Member "${err.errorMemberName || ''}" has invalid data (${firstErrorKey}): ${errorText}`;
            } else {
              // Map the backend error key to frontend field name
              let fieldName = firstErrorKey;
              if (firstErrorKey === 'admin_email') fieldName = 'adminEmail';
              else if (firstErrorKey === 'admin_name') fieldName = 'adminName';
              else if (firstErrorKey === 'admin_password') fieldName = 'adminPass';
              else if (firstErrorKey === 'admin_phone') fieldName = 'adminPhone';
              else if (firstErrorKey === 'est_year') fieldName = 'estYear';
              else if (firstErrorKey === 'registration_no') fieldName = 'registrationNo';
              else if (firstErrorKey === 'office_address') fieldName = 'officeAddress';

              // Map fields to steps:
              // Step 0: Information (Basic details, Branding, Contact Info)
              // Step 1: Hierarchy & Account (Parent, Admin Setup, Plan)
              // Step 2: Committee Builder
              // Step 3: Review & Documents
              const step0Fields = [
                "name", "caste", "subCaste", "state", "district", "taluka", "village",
                "estYear", "registrationNo", "desc", "officeAddress", "logo", "cover",
                "email", "phone", "website"
              ];
              const step1Fields = [
                "type", "parentId", "adminName", "adminEmail", "adminPhone", "adminPass", "plan"
              ];

              let targetStep = 3; // Default is the summary/review step
              if (step0Fields.includes(fieldName)) {
                targetStep = 0;
              } else if (step1Fields.includes(fieldName)) {
                targetStep = 1;
              }

              setStep(targetStep);
              displayError = `Error in field "${firstErrorKey}": ${errorText}`;

              // Scroll to and focus the field
              setTimeout(() => {
                const selector = `[name="${fieldName}"], input[placeholder*="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`;
                const element = document.querySelector(selector) as HTMLElement;
                if (element) {
                  element.focus();
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Add temporary red ring
                  element.classList.add("ring-2", "ring-red-500");
                  setTimeout(() => {
                    element.classList.remove("ring-2", "ring-red-500");
                  }, 5000);
                }
              }, 300);
            }
          }
        }

        setErrorMsg(displayError);
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    }

    setDir(1);
    setStep(s => Math.min(STEPS.length - 1, s + 1));
  };

  const handleBack = () => {
    setErrorMsg(null);
    setDir(-1);
    setStep(s => Math.max(0, s - 1));
  };

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-4rem)] bg-sand bg-geometric py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display text-4xl sm:text-5xl font-bold text-foreground"
            >
              Register Your Samaj
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-warm-muted mt-2 text-sm sm:text-base max-w-xl mx-auto"
            >
              Establish a digital headquarters for your community. Onboard families, manage events, organize committees, and connect with global members.
            </motion.p>
          </div>

          {/* Main Card */}
          <div className="bg-surface rounded-2xl shadow-warm border border-warm overflow-hidden mt-6">

            {/* Draft Saved Indicator */}
            {step < 4 && (
              <div className="bg-primary/5 border-b border-primary/10 px-6 py-2.5 flex justify-between items-center text-xs text-primary font-medium">
                <span className="flex items-center gap-1.5"><Info className="w-4 h-4" /> Drafting Community Profile</span>
                <span className="opacity-80">Draft auto-saved just now</span>
              </div>
            )}

            <div className="p-6 sm:p-8 lg:p-10">
              {/* Premium Progress Stepper */}
              {step < 4 && (
                <div className="mb-8 pb-6 border-b border-warm/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                          Step {step + 1} of 4
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-teal/10 text-teal px-2.5 py-1 rounded-full">
                          {Math.round((step / 3) * 100)}% Complete
                        </span>
                      </div>
                      <h3 className="font-ui text-xl font-bold mt-2 text-foreground">
                        {STEPS[step].name}
                      </h3>
                      <p className="text-xs text-warm-muted mt-0.5">{STEPS[step].desc}</p>
                    </div>
                  </div>

                  {/* Progress Line Segments */}
                  <div className="grid grid-cols-4 gap-2">
                    {STEPS.slice(0, 4).map((s, i) => (
                      <div key={i} className="h-1.5 rounded-full bg-sand-dark/25 overflow-hidden relative">
                        <motion.div
                          className={`absolute inset-0 ${step > i ? "bg-teal" : "bg-gradient-to-r from-primary to-gold"}`}
                          initial={{ width: "0%" }}
                          animate={{
                            width: step >= i ? "100%" : "0%"
                          }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  initial={{ x: dir > 0 ? 50 : -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: dir > 0 ? -50 : 50, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {step === 0 && (
                    <StepInfo
                      formData={formData}
                      updateField={updateField}
                      setShowParentModal={setShowParentModal}
                      logoFileRef={logoFileRef}
                      coverFileRef={coverFileRef}
                    />
                  )}
                  {step === 1 && (
                    <StepHierarchy
                      formData={formData}
                      updateField={updateField}
                    />
                  )}
                  {step === 2 && (
                    <StepCommittee
                      committee={committee}
                      setCommittee={setCommittee}
                    />
                  )}
                  {step === 3 && (
                    <StepReview
                      formData={formData}
                      committee={committee}
                      updateField={updateField}
                    />
                  )}
                  {step === 4 && !otpVerified && (
                    <div className="max-w-md mx-auto py-8 text-center space-y-6">
                      <h2 className="font-serif text-2xl font-bold text-[#2C1D12]">Verify Admin Email</h2>
                      <p className="text-warm-muted text-xs sm:text-sm">
                        A 6-digit verification code has been sent to <strong>{formData.adminEmail}</strong>.
                      </p>

                      <div className="space-y-4 text-left">
                        <div>
                          <label className="text-[10px] font-bold text-warm-muted uppercase tracking-wider block mb-1">
                            Registered Admin Email
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={formData.adminEmail}
                            className="w-full px-3 py-2 rounded-lg border border-warm bg-sand/20 text-stone-500 text-sm focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-warm-muted uppercase tracking-wider block mb-1">
                            6-Digit OTP Code
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="Enter 6-digit OTP"
                            className="w-full px-3 py-2.5 rounded-lg border border-warm focus:border-primary bg-surface text-center font-bold text-lg tracking-[0.5em] outline-none transition"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (otp.length !== 6 || !/^\d+$/.test(otp)) {
                              setErrorMsg("Please enter a valid 6-digit OTP.");
                              return;
                            }
                            setIsVerifyingOtp(true);
                            setErrorMsg(null);
                            try {
                              await api.registerVerifyOTP(formData.adminEmail, otp);
                              setOtpVerified(true);
                              toast.success("Admin email verified successfully!");
                            } catch (err: any) {
                              setErrorMsg(err.message || "Invalid OTP. Please try again.");
                            } finally {
                              setIsVerifyingOtp(false);
                            }
                          }}
                          disabled={isVerifyingOtp}
                          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isVerifyingOtp ? "Verifying..." : "Verify & Activate Account"}
                        </button>

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={async () => {
                              setErrorMsg(null);
                              try {
                                await api.registerSendOTP(formData.adminEmail);
                                toast.success("A new 6-digit OTP code has been sent.");
                              } catch (err: any) {
                                setErrorMsg(err.message || "Failed to resend OTP.");
                              }
                            }}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Resend OTP
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {step === 4 && otpVerified && (
                    <StepSuccess
                      formData={formData}
                      createdCommunity={createdCommunityInfo}
                      onFinish={() => {
                        sessionStorage.removeItem("wag_registered_community");
                        navigate({ to: "/" });
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Error Message */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium"
                >
                  {errorMsg}
                </motion.div>
              )}

              {/* Action Buttons */}
              {step < 4 && (
                <div className="flex justify-between items-center mt-10 pt-6 border-t border-warm">
                  <button
                    onClick={handleBack}
                    disabled={step === 0}
                    className="px-5 py-2.5 rounded-xl border border-warm hover:bg-sand text-sm font-medium disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-2 transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark shadow-sapphire flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : step === 3 ? "Submit Registration" : "Continue"} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ParentCommunityModal
        open={showParentModal}
        onClose={handleCancelParentSelection}
        onCancel={handleCancelParentSelection}
        onContinue={handleContinueParentSelection}
        selectedParentId={selectedParentId}
        setSelectedParentId={setSelectedParentId}
        formData={formData}
      />
    </PageTransition>
  );
}

// ==========================================
// STEP 1: BASIC INFORMATION
// ==========================================
function StepInfo({ formData, updateField, setShowParentModal, logoFileRef, coverFileRef }: {
  formData: any;
  updateField: any;
  setShowParentModal: (open: boolean) => void;
  logoFileRef: React.MutableRefObject<File | null>;
  coverFileRef: React.MutableRefObject<File | null>;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-warm pb-4">
        <h2 className="font-ui text-xl font-bold">Community Information</h2>
        <p className="text-warm-muted text-xs mt-1">Provide public details for identification and landing page headers.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium block mb-1.5">Community Name *</label>
          <input
            type="text"
            name="name"
            placeholder="e.g. Rampara Ahir Samaj"
            value={formData.name}
            onChange={e => updateField("name", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm bg-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Community Type *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                updateField("type", "Super");
                updateField("parentId", "");
                updateField("parentName", "");
                updateField("parentHierarchy", "");
              }}
              className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-between ${formData.type === "Super"
                ? "border-primary bg-primary/5 text-foreground"
                : "border-warm bg-surface hover:bg-sand/30"
                }`}
            >
              <div className="flex justify-between items-center w-full">
                <Building2 className={`w-5 h-5 ${formData.type === "Super" ? "text-primary" : "text-warm-muted"}`} />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.type === "Super" ? "border-primary" : "border-warm"}`}>
                  {formData.type === "Super" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </div>
              <div className="mt-4">
                <div className="font-semibold text-sm">Super Community</div>
                <div className="text-[10px] text-warm-muted mt-0.5">Independent State/Apex Body</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowParentModal(true)}
              className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-between ${formData.type === "Subsidiary"
                ? "border-primary bg-primary/5 text-foreground"
                : "border-warm bg-surface hover:bg-sand/30"
                }`}
            >
              <div className="flex justify-between items-center w-full">
                <Activity className={`w-5 h-5 ${formData.type === "Subsidiary" ? "text-primary" : "text-warm-muted"}`} />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.type === "Subsidiary" ? "border-primary" : "border-warm"}`}>
                  {formData.type === "Subsidiary" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </div>
              <div className="mt-4">
                <div className="font-semibold text-sm">Subsidiary</div>
                <div className="text-[10px] text-warm-muted mt-0.5">Linked under a Parent Body</div>
              </div>
            </button>
          </div>
        </div>

        {formData.type === "Subsidiary" && formData.parentName && (
          <div className="sm:col-span-2 text-xs p-3.5 rounded-xl bg-teal/5 border border-teal/20 text-teal font-medium flex justify-between items-center">
            <span>Linked Parent: <strong className="font-semibold">{formData.parentName}</strong></span>
            <button
              type="button"
              onClick={() => setShowParentModal(true)}
              className="text-primary hover:underline font-semibold"
            >
              Change
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Caste</label>
            <select
              name="caste"
              value={formData.caste}
              onChange={e => updateField("caste", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-warm bg-surface focus:border-primary outline-none"
            >
              {["Ahir", "Patel", "Brahmin", "Rajput", "Leva", "Kadva", "General"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Sub-Caste (optional)</label>
            <input
              type="text"
              name="subCaste"
              placeholder="e.g. Levapunj, Pancholi"
              value={formData.subCaste}
              onChange={e => updateField("subCaste", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-warm bg-surface focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-warm pt-6">
        <h3 className="font-ui font-semibold text-sm text-foreground mb-4">Location & Geography</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">State</label>
            <select
              name="state"
              value={formData.state}
              onChange={e => updateField("state", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
            >
              {["Gujarat", "Maharashtra", "Rajasthan", "Karnataka", "Delhi"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">District</label>
            <input
              type="text"
              name="district"
              placeholder="e.g. Amreli"
              value={formData.district}
              onChange={e => updateField("district", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Taluka / Sub-district</label>
            <input
              type="text"
              name="taluka"
              placeholder="e.g. Rajula"
              value={formData.taluka}
              onChange={e => updateField("taluka", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Village / City</label>
            <input
              type="text"
              name="village"
              placeholder="e.g. Rampara"
              value={formData.village}
              onChange={e => updateField("village", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-warm pt-6">
        <h3 className="font-ui font-semibold text-sm text-foreground mb-4">Branding & Bio</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-warm-muted block mb-1.5">Est. Year (optional)</label>
                <input
                  type="number"
                  name="estYear"
                  placeholder="e.g. 1994"
                  value={formData.estYear}
                  onChange={e => updateField("estYear", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-warm-muted block mb-1.5">GST/Trust Reg. No (optional)</label>
                <input
                  type="text"
                  name="registrationNo"
                  placeholder="e.g. F-12345/AMR"
                  value={formData.registrationNo}
                  onChange={e => updateField("registrationNo", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-warm-muted block mb-1">Public Description</label>
              <textarea
                rows={3}
                name="desc"
                placeholder="Briefly describe your community's mission and history..."
                value={formData.desc}
                onChange={e => updateField("desc", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-warm-muted block mb-1">Office Address (optional)</label>
              <input
                type="text"
                name="officeAddress"
                placeholder="Physical registration office address..."
                value={formData.officeAddress}
                onChange={e => updateField("officeAddress", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-warm-muted block mb-1.5">Samaj Logo</label>
              <label className="cursor-pointer block relative group">
                <div className="aspect-square rounded-xl bg-sand border-2 border-dashed border-warm hover:border-primary flex flex-col items-center justify-center overflow-hidden transition relative">
                  {formData.logo ? (
                    <>
                      <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition">
                        Change Logo
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-warm-muted mb-1" />
                      <span className="text-[10px] text-warm-muted font-medium text-center px-2">Upload Square Logo (PNG/JPG)</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      logoFileRef.current = file;               // store actual File
                      updateField("logo", URL.createObjectURL(file)); // preview only
                    }
                  }}
                />
              </label>
            </div>

            <div>
              <label className="text-xs font-medium text-warm-muted block mb-1.5">Cover Banner Image</label>
              <label className="cursor-pointer block relative group">
                <div className="aspect-square rounded-xl bg-sand border-2 border-dashed border-warm hover:border-primary flex flex-col items-center justify-center overflow-hidden transition relative">
                  {formData.cover ? (
                    <>
                      <img src={formData.cover} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition">
                        Change Cover
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-warm-muted mb-1" />
                      <span className="text-[10px] text-warm-muted font-medium text-center px-2">Upload Horizontal Banner</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      coverFileRef.current = file;               // store actual File
                      updateField("cover", URL.createObjectURL(file)); // preview only
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-warm pt-6">
        <h3 className="font-ui font-semibold text-sm text-foreground mb-4">Contact Info</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Email *</label>
            <input
              type="email"
              name="email"
              placeholder="contact@samaj.org"
              value={formData.email}
              onChange={e => updateField("email", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Phone *</label>
            <input
              type="text"
              name="phone"
              placeholder="e.g. +91 98250 12345"
              value={formData.phone}
              onChange={e => updateField("phone", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Website URL (optional)</label>
            <input
              type="text"
              name="website"
              placeholder="https://samaj.org"
              value={formData.website}
              onChange={e => updateField("website", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// STEP 2: HIERARCHY, ADMIN & PRICING
// ==========================================
function StepHierarchy({ formData, updateField }: { formData: any; updateField: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allCommunities, setAllCommunities] = useState<any[]>([]);
  const [showAdminPass, setShowAdminPass] = useState(false);

  useEffect(() => {
    api.getCommunities().then(res => {
      if (res && res.length > 0) {
        // Filter: Only Approved/Active Communities should appear in Parent Community selection
        const approvedSupers = res.filter((c: any) =>
          c.status === "Approved" || c.status === "Active"
        );
        const formatted = approvedSupers.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          state: c.state,
          hierarchy: c.path ? c.path.join(' → ') : c.name
        }));
        setAllCommunities(formatted);
      } else {
        setAllCommunities(MOCK_PARENTS);
      }
    }).catch(() => {
      setAllCommunities(MOCK_PARENTS);
    });
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = allCommunities.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const selectParent = (parent: any) => {
    updateField("parentId", parent.id);
    updateField("parentName", parent.name);
    updateField("parentHierarchy", parent.hierarchy);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="space-y-8">
      {/* 1. Hierarchy configuration */}
      <div>
        <div className="border-b border-warm pb-4 mb-5">
          <h2 className="font-ui text-xl font-bold">Hierarchy & Affiliation</h2>
          <p className="text-warm-muted text-xs mt-1">Configure where this community sits in the organisational chart.</p>
        </div>

        {formData.type === "Super" ? (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-5 rounded-xl bg-gold-light border border-amber-200 flex items-start gap-3"
          >
            <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-ui font-semibold text-gold">Super Community Selected</h4>
              <p className="text-xs text-warm-muted mt-1 leading-relaxed">
                Super communities are independent parent entities. They require <strong>no approval from parent networks</strong>. Your registration goes straight to the general Platform Administrator for verification.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <label className="text-sm font-medium block">Search & Link Parent Community *</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-warm-muted" />
              <input
                type="text"
                placeholder="Type to search parent board (e.g. Gujarat Ahir...)"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-warm bg-surface focus:border-primary outline-none transition text-sm"
              />

              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-surface border border-warm rounded-xl shadow-warm z-30 overflow-hidden">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectParent(p)}
                      className="w-full text-left px-4 py-3 hover:bg-sand border-b border-warm last:border-0 text-sm flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{p.name}</div>
                        <div className="text-xs text-warm-muted">{p.hierarchy}</div>
                      </div>
                      <Plus className="w-4 h-4 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formData.parentId ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-teal/5 border border-teal/20"
              >
                <div className="text-xs text-warm-muted uppercase tracking-wider font-semibold">Hierarchy Preview</div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex flex-col items-center">
                    <div className="px-3 py-1.5 bg-sand rounded-lg border border-warm text-xs font-semibold text-warm-muted">{formData.parentName}</div>
                    <div className="w-[2px] h-6 bg-border my-1" />
                    <div className="px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20 text-xs font-bold text-primary">{formData.name || "Your Samaj"}</div>
                  </div>
                  <div className="text-xs text-warm-muted italic ml-4">
                    * Request will be routed to the admin of <strong>{formData.parentName}</strong> for approval.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateField("parentId", "");
                    updateField("parentName", "");
                    updateField("parentHierarchy", "");
                  }}
                  className="text-xs text-red-500 font-semibold mt-4 hover:underline flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Remove Affiliation
                </button>
              </motion.div>
            ) : (
              <p className="text-xs text-warm-muted italic">No parent linked yet. Please search and select an affiliation.</p>
            )}
          </div>
        )}
      </div>

      {/* 2. Admin Account Creation */}
      <div className="border-t border-warm pt-6">
        <div className="border-b border-warm pb-3 mb-5">
          <h2 className="font-ui text-xl font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> Create Admin Account
          </h2>
          <p className="text-warm-muted text-xs mt-1">This login will have full access to manage your community admin dashboard.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Admin Full Name *</label>
            <input
              type="text"
              name="adminName"
              placeholder="e.g. Mehulbhai Patel"
              value={formData.adminName}
              onChange={e => updateField("adminName", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Admin Email * (Login Username)</label>
            <input
              type="email"
              name="adminEmail"
              placeholder="mehul@samaj.org"
              value={formData.adminEmail}
              onChange={e => updateField("adminEmail", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Admin Phone Number</label>
            <input
              type="text"
              name="adminPhone"
              placeholder="e.g. +91 98251 98765"
              value={formData.adminPhone}
              onChange={e => updateField("adminPhone", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Admin Password *</label>
            <div className="relative">
              <input
                type={showAdminPass ? "text" : "password"}
                name="adminPass"
                placeholder="Create secure password"
                value={formData.adminPass}
                onChange={e => updateField("adminPass", e.target.value)}
                className="w-full pl-3 pr-10 py-2 rounded-lg border border-warm bg-surface text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-warm-muted hover:text-primary transition-colors"
                onClick={() => setShowAdminPass(!showAdminPass)}
              >
                {showAdminPass ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {formData.adminPass && (() => {
              const getPasswordStrength = (pwd: string) => {
                if (!pwd) return { score: 0, label: "", color: "bg-stone-200", text: "text-stone-500" };
                let score = 0;
                if (pwd.length >= 8) score++;
                if (/[A-Z]/.test(pwd)) score++;
                if (/[a-z]/.test(pwd)) score++;
                if (/\d/.test(pwd)) score++;
                if (/[@$!%*?&]/.test(pwd)) score++;

                if (score <= 2) return { score, label: "Weak", color: "bg-red-500", text: "text-red-500" };
                if (score <= 4) return { score, label: "Medium", color: "bg-amber-500", text: "text-amber-500" };
                return { score, label: "Strong", color: "bg-green-500", text: "text-green-500" };
              };
              const strObj = getPasswordStrength(formData.adminPass);
              return (
                <div className="mt-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span className="text-warm-muted">Password Strength</span>
                    <span className={strObj.text}>{strObj.label}</span>
                  </div>
                  <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strObj.color}`}
                      style={{ width: `${(strObj.score / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 3. Pricing Plan Selection */}
      <div className="border-t border-warm pt-6">
        <div className="border-b border-warm pb-3 mb-5">
          <h2 className="font-ui text-xl font-bold">Select Subscription Plan</h2>
          <p className="text-warm-muted text-xs mt-1">Select the tools and limits that fit your community size.</p>
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { id: "Free", price: "₹0", desc: "For small villages", limits: "Up to 200 members" },
            { id: "Basic", price: "₹999/mo", desc: "Standard community management", limits: "Up to 2,000 members" },
            { id: "Pro", price: "₹2,499/mo", desc: "All directories & matrimony", limits: "Unlimited members" },
            { id: "Enterprise", price: "Custom", desc: "For large global networks", limits: "Multi-branch & dedicated support" },
          ].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => updateField("plan", p.id)}
              className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between transition ${formData.plan === p.id
                ? "border-primary bg-primary/5 shadow-warm"
                : "border-warm bg-surface hover:bg-sand/30"
                }`}
            >
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${formData.plan === p.id ? "bg-primary/20 text-primary" : "bg-sand text-warm-muted"
                  }`}>
                  {p.id}
                </span>
                <div className="font-display text-2xl font-bold text-foreground mt-3">{p.price}</div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-warm-muted leading-snug">{p.desc}</div>
                <div className="text-[10px] font-bold text-foreground mt-2">{p.limits}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// STEP 3: COMMITTEE BUILDER
// ==========================================
function StepCommittee({ committee, setCommittee }: { committee: CommitteeMember[]; setCommittee: any }) {
  const [newMember, setNewMember] = useState({
    name: "",
    role: "President",
    phone: "",
    email: "",
    avatar: ""
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addMember = () => {
    setError(null);
    if (!newMember.name.trim()) {
      setError("Full Name is required");
      return;
    }
    if (newMember.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.email)) {
      setError("Please enter a valid email address (e.g. member@samaj.org)");
      return;
    }
    const member: CommitteeMember = {
      id: Date.now().toString(),
      ...newMember,
      avatar: avatarPreview || ""
    };
    setCommittee((prev: CommitteeMember[]) => [...prev, member]);
    // Reset form
    setNewMember({
      name: "",
      role: "Member",
      phone: "",
      email: "",
      avatar: ""
    });
    setAvatarPreview(null);
  };

  const removeMember = (id: string) => {
    setCommittee((prev: CommitteeMember[]) => prev.filter((m: CommitteeMember) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-warm pb-4">
        <h2 className="font-ui text-xl font-bold">Committee Members Builder</h2>
        <p className="text-warm-muted text-xs mt-1">Configure your community's active leadership committee. You can add multiple office bearers.</p>
      </div>

      {/* Member Builder Input Block */}
      <div className="bg-sand/30 p-5 rounded-xl border border-warm space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-muted">New Member Form</h3>

        {error && (
          <div className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 p-2.5 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-warm-muted block mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Enter member name"
              value={newMember.name}
              onChange={e => setNewMember(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Designation</label>
            <select
              value={newMember.role}
              onChange={e => setNewMember(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm outline-none focus:border-primary"
            >
              {["President", "Vice President", "Secretary", "Treasurer", "Member", "Trustee", "Adviser"].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="+91 9XXXX XXXXX"
              value={newMember.phone}
              onChange={e => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="e.g. member@samaj.org"
              value={newMember.email}
              onChange={e => setNewMember(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-warm-muted block mb-1">Photo (optional)</label>
            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-warm bg-surface text-sm font-medium hover:bg-sand transition">
              <Upload className="w-4 h-4 text-warm-muted" />
              <span className="truncate">{avatarPreview ? "Photo Added" : "Upload File"}</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setAvatarPreview(URL.createObjectURL(file));
                }}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={addMember}
            className="px-4 py-2 bg-teal text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-opacity-90 shadow-warm transition"
          >
            <Plus className="w-4 h-4" /> Add Officer to Committee
          </button>
        </div>
      </div>

      {/* Preview Grid */}
      <div>
        <h3 className="font-ui font-semibold text-sm text-foreground mb-3">Committee Board ({committee.length})</h3>

        {committee.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-warm rounded-xl text-warm-muted text-sm">
            No committee members added yet. Add officers above to populate the board.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {committee.map(m => (
                <motion.div
                  key={m.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex items-center gap-3 bg-sand/35 p-4 rounded-xl border border-warm relative group hover:shadow-warm transition"
                >
                  {m.avatar ? (
                    <img src={m.avatar} className="w-12 h-12 rounded-full object-cover border border-warm" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate text-foreground">{m.name}</div>
                    <div className="text-xs font-medium text-primary mt-0.5">{m.role}</div>
                    <div className="text-[10px] text-warm-muted mt-1">{m.phone} {m.email && `· ${m.email}`}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    className="text-red-500 hover:text-red-700 p-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition absolute right-2 top-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// STEP 4: REVIEW & VERIFICATION
// ==========================================
function StepReview({ formData, committee, updateField }: { formData: any; committee: CommitteeMember[]; updateField: any }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-6">
      <div className="border-b border-warm pb-4">
        <h2 className="font-ui text-xl font-bold">Review & Verify Application</h2>
        <p className="text-warm-muted text-xs mt-1">Carefully review all submitted details before finalizing your request.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* Document Upload */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-sand/30 p-5 rounded-xl border border-warm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-muted mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" /> Verification Documents
            </h3>
            <p className="text-xs text-warm-muted mb-4 leading-relaxed">
              Upload a copy of your Trust Deed, registration certificate, or a formal letter on letterhead signed by the President to expedite validation.
            </p>

            <label className="cursor-pointer block">
              <div className="p-4 bg-surface hover:bg-sand/40 border-2 border-dashed border-warm rounded-lg flex flex-col items-center justify-center text-center transition">
                <Upload className="w-6 h-6 text-warm-muted mb-2" />
                <span className="text-xs font-semibold text-primary">Upload Document</span>
                <span className="text-[10px] text-warm-muted mt-1">(PDF, JPG, max 5MB)</span>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) updateField("docName", file.name);
                }}
              />
            </label>

            {formData.docName && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-teal/10 rounded-lg text-teal text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span className="truncate flex-1">{formData.docName}</span>
                <button type="button" onClick={() => updateField("docName", "")} className="text-warm-muted hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-xs text-primary space-y-1">
            <div className="font-semibold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Verified Connection</div>
            <p className="text-warm-muted leading-relaxed">Your data is stored in compliance with the local security rules.</p>
          </div>
        </div>

        {/* Detailed Data Summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-sand/20 rounded-xl border border-warm overflow-hidden">
            <div className="bg-sand p-4 border-b border-warm flex justify-between items-center">
              <span className="font-ui font-semibold text-sm">Application Summary</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary">{formData.plan} Plan</span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <div className="text-warm-muted">Samaj Name</div>
                  <div className="font-semibold text-sm mt-0.5 text-foreground">{formData.name}</div>
                </div>
                <div>
                  <div className="text-warm-muted">Type & Affiliation</div>
                  <div className="font-semibold mt-0.5 text-foreground">
                    {formData.type === "Super" ? "Super (Independent)" : `Subsidiary under: ${formData.parentName}`}
                  </div>
                </div>
                <div>
                  <div className="text-warm-muted">Geographical Area</div>
                  <div className="font-semibold mt-0.5 text-foreground">{formData.village}, {formData.district}, {formData.state}</div>
                </div>
                <div>
                  <div className="text-warm-muted">Caste Category</div>
                  <div className="font-semibold mt-0.5 text-foreground">{formData.caste} {formData.subCaste && `(${formData.subCaste})`}</div>
                </div>
                <div>
                  <div className="text-warm-muted">Establishment & Trust ID</div>
                  <div className="font-semibold mt-0.5 text-foreground">
                    {formData.estYear ? `Est. ${formData.estYear}` : "—"} {formData.registrationNo && `· Reg No: ${formData.registrationNo}`}
                  </div>
                </div>
                <div>
                  <div className="text-warm-muted">Admin Account</div>
                  <div className="font-semibold mt-0.5 text-foreground">{formData.adminName} ({formData.adminEmail})</div>
                </div>
              </div>

              <div className="border-t border-warm pt-3">
                <div className="text-warm-muted mb-2">Committee Structure ({committee.length} members)</div>
                <div className="flex flex-wrap gap-2">
                  {committee.map(c => (
                    <div key={c.id} className="bg-surface px-2.5 py-1 rounded-md border border-warm flex items-center gap-1.5">
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-[10px] text-primary bg-primary/5 px-1.5 py-0.2 rounded">{c.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Agreements */}
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 text-xs text-warm-muted leading-relaxed cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-warm text-primary focus:ring-primary"
              />
              <span>
                I hereby declare that I am an authorized office bearer of <strong>{formData.name || "this samaj"}</strong>, and all submitted documents and registrations details are authentic and true.
              </span>
            </label>
            <div className="text-[10px] text-warm-muted pl-6">
              By submitting, you agree to our Platform Terms of Use and Privacy Policy.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ==========================================
// STEP 5: SUCCESS & APPROVAL TIMELINE
// ==========================================
function StepSuccess({ formData, createdCommunity, onFinish }: { formData: any; createdCommunity: any; onFinish: () => void }) {
  const [currentCommunity, setCurrentCommunity] = useState<any>(createdCommunity);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!currentCommunity?.id) return;
    setRefreshing(true);
    try {
      const updated = await api.getCommunity(String(currentCommunity.id));
      if (updated) {
        setCurrentCommunity(updated);
      }
    } catch (e) {
      console.warn("Failed to refresh status", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (createdCommunity?.id) {
      api.getCommunity(String(createdCommunity.id)).then(res => {
        if (res) setCurrentCommunity(res);
      });
    }
  }, [createdCommunity]);

  const isSubsidiary = (currentCommunity?.type === "Subsidiary" || formData.type === "Subsidiary");
  const parentName = currentCommunity?.parent_name || formData.parentName || "Parent Board";

  const timelineNodes = [];

  timelineNodes.push({
    title: "Registration Request Submitted",
    desc: `Community profile for '${currentCommunity?.name || formData.name}' registered successfully.`,
    status: "completed",
    date: currentCommunity?.created_at ? new Date(currentCommunity.created_at).toLocaleDateString() : "Just now"
  });

  if (isSubsidiary) {
    const isApprovedByParent = currentCommunity?.status === "Approved" ||
      currentCommunity?.status === "Active" ||
      currentCommunity?.status === "Pending Super Admin Approval";
    const isRejectedByParent = currentCommunity?.status === "Rejected By Parent Community Admin";

    let parentStatus = "pending";
    let parentDesc = `Awaiting hierarchy validation and approval from ${parentName}.`;
    if (isApprovedByParent) {
      parentStatus = "completed";
      parentDesc = `Approved and verified by ${parentName} administration.`;
    } else if (isRejectedByParent) {
      parentStatus = "rejected";
      parentDesc = `Rejected by ${parentName}. Reason: ${currentCommunity?.approval_history?.[0]?.remarks || "Verification failed."}`;
    } else if (currentCommunity?.status === "Pending Parent Community Approval") {
      parentStatus = "current";
    }

    timelineNodes.push({
      title: `${parentName} Verification`,
      desc: parentDesc,
      status: parentStatus,
      date: isApprovedByParent ? "Verified" : isRejectedByParent ? "Rejected" : "In Progress"
    });
  }

  const isSuperApproved = currentCommunity?.status === "Approved" || currentCommunity?.status === "Active";
  const isSuperRejected = currentCommunity?.status === "Rejected By Super Admin";

  let superStatus = "pending";
  let superDesc = "Awaiting final platform administration verification.";

  if (isSuperApproved) {
    superStatus = "completed";
    superDesc = "Platform credentials generated. Account activated.";
  } else if (isSuperRejected) {
    superStatus = "rejected";
    superDesc = `Rejected by Platform Super Admin. Reason: ${currentCommunity?.approval_history?.[0]?.remarks || "Verification failed."}`;
  } else if (currentCommunity?.status === "Pending Super Admin Approval") {
    superStatus = "current";
    superDesc = "Reviewing document and registration compliance.";
  }

  timelineNodes.push({
    title: "Platform Administration Review",
    desc: superDesc,
    status: superStatus,
    date: isSuperApproved ? "Activated" : isSuperRejected ? "Rejected" : "Awaiting"
  });

  const activeStatus = isSuperApproved ? "completed" : "pending";
  timelineNodes.push({
    title: "Community Workspace Live",
    desc: isSuperApproved
      ? "Login enabled for Samaj Admins. Portal workspace activated."
      : "Community admin portal remains locked until verification finishes.",
    status: activeStatus,
    date: isSuperApproved ? "Active" : "Locked"
  });

  return (
    <div className="text-center py-10 max-w-xl mx-auto space-y-6">
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className="w-20 h-20 rounded-full bg-teal/15 flex items-center justify-center"
        >
          {currentCommunity?.status === "Approved" || currentCommunity?.status === "Active" ? (
            <CheckCircle2 className="w-12 h-12 text-teal" />
          ) : currentCommunity?.status?.startsWith("Rejected") ? (
            <XCircle className="w-12 h-12 text-red-500" />
          ) : (
            <Clock className="w-12 h-12 text-primary animate-pulse" />
          )}
        </motion.div>
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-3xl font-bold text-foreground">
          {currentCommunity?.status === "Approved" || currentCommunity?.status === "Active"
            ? "Workspace Activated!"
            : currentCommunity?.status?.startsWith("Rejected")
              ? "Registration Rejected"
              : "Review In Progress"}
        </h2>
        <p className="text-sm text-warm-muted">
          Current status: <span className="font-semibold text-primary">{currentCommunity?.status || "Pending"}</span>
        </p>
      </div>

      <div className="bg-sand/35 p-6 rounded-2xl border border-warm text-left space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-muted">Live Verification Timeline</h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>

        <div className="space-y-4">
          {timelineNodes.map((t, i) => (
            <div key={i} className="flex gap-4 relative">
              {i < timelineNodes.length - 1 && (
                <div className={`absolute left-3 top-6 bottom-0 w-[2px] ${t.status === "completed" ? "bg-teal" : "bg-border"
                  }`} />
              )}

              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${t.status === "completed"
                ? "bg-teal text-white"
                : t.status === "current"
                  ? "bg-primary/20 text-primary border border-primary animate-pulse"
                  : t.status === "rejected"
                    ? "bg-red-500 text-white"
                    : "bg-surface text-warm-muted border border-warm"
                }`}>
                {t.status === "completed" ? <Check className="w-3.5 h-3.5" /> : t.status === "rejected" ? <X className="w-3.5 h-3.5" /> : i + 1}
              </div>

              <div className="flex-1 min-w-0 -mt-0.5">
                <div className="flex justify-between items-center">
                  <h4 className={`font-semibold text-sm ${t.status === "rejected" ? "text-red-500" : "text-foreground"}`}>{t.title}</h4>
                  <span className="text-[10px] text-warm-muted font-medium">{t.date}</span>
                </div>
                <p className="text-xs text-warm-muted mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={onFinish}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark shadow-sapphire transition"
        >
          Return to Landing Page
        </button>
      </div>
    </div>
  );
}

function ParentCommunityModal({
  open,
  onClose,
  onCancel,
  onContinue,
  selectedParentId,
  setSelectedParentId,
  formData
}: {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  onContinue: (parent: any) => void;
  selectedParentId: string;
  setSelectedParentId: (id: string) => void;
  formData: any;
}) {
  const [search, setSearch] = useState("");
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      api.getCommunities()
        .then(res => {
          if (res) {
            // Filter: Only Approved/Active Communities, regardless of type
            const filtered = res.filter((c: any) =>
              c.status === "Approved" || c.status === "Active"
            );
            setCommunities(filtered);
          }
        })
        .catch(err => console.error("Failed to load parent communities", err))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const selectedParent = communities.find(c => c.id.toString() === selectedParentId);

  // Search filter
  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.registration_no && c.registration_no.toLowerCase().includes(search.toLowerCase())) ||
    `${c.village} ${c.district} ${c.state}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.path && c.path.join(' → ').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Modal open={open} onClose={onCancel} title="Select Parent Community" size="md">
      <div className="space-y-5 text-sm">
        <p className="text-warm-muted text-xs leading-relaxed">
          This community will be registered under an existing community and will require approval from both the Super Admin and the selected Parent Community Admin.
        </p>

        {/* Searchable Dropdown */}
        <div className="relative">
          <label className="text-xs font-semibold text-warm-muted block mb-1">Parent Community *</label>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface flex items-center justify-between cursor-pointer focus-within:border-primary hover:border-primary-dark transition"
          >
            {selectedParent ? (
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  {selectedParent.path ? selectedParent.path.join(' → ') : selectedParent.name}
                </span>
                <span className="text-[10px] text-warm-muted">
                  Type: {selectedParent.type} · Code: {selectedParent.registration_no || `COMM-${selectedParent.id}`} · {selectedParent.village || selectedParent.district}, {selectedParent.state}
                </span>
              </div>
            ) : (
              <span className="text-warm-muted text-xs">Search and select parent community...</span>
            )}
            <ChevronDown className="w-4 h-4 text-warm-muted" />
          </div>

          {dropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-surface border border-warm rounded-xl shadow-warm z-50 overflow-hidden max-h-60 flex flex-col">
              <div className="p-2 border-b border-warm flex items-center bg-sand/20">
                <Search className="w-4 h-4 text-warm-muted mr-2" />
                <input
                  type="text"
                  placeholder="Type community name, hierarchy path, or location..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="w-full bg-transparent outline-none text-xs text-foreground"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-4 text-center text-xs text-warm-muted">Loading parent communities...</div>
                ) : filteredCommunities.length === 0 ? (
                  <div className="p-4 text-center text-xs text-warm-muted">No approved parent communities found.</div>
                ) : (
                  filteredCommunities.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedParentId(c.id.toString());
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-sand/30 border-b border-warm last:border-0 text-xs flex justify-between items-center transition ${c.id.toString() === selectedParentId ? 'bg-primary/5 font-semibold' : ''}`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-foreground font-semibold truncate">
                          {c.path ? c.path.join(' → ') : c.name}
                        </div>
                        <div className="text-[10px] text-warm-muted truncate mt-0.5">
                          Type: {c.type} · Code: {c.registration_no || `COMM-${c.id}`} · {c.village || c.district}, {c.state}
                        </div>
                      </div>
                      {c.id.toString() === selectedParentId && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Parent Community Information Preview */}
        {selectedParent && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-sand/30 border border-warm space-y-3"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-warm-muted">Parent Community Preview</div>
            <div className="flex items-center gap-3">
              <AvatarCircle name={selectedParent.name} src={selectedParent.logo} size={48} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground truncate">{selectedParent.name}</div>
                <div className="text-xs text-warm-muted flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{selectedParent.village || selectedParent.district || selectedParent.taluka}, {selectedParent.state}</span>
                </div>
                <div className="text-xs text-warm-muted flex items-center gap-1 mt-0.5">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Admin: {selectedParent.admin_name || "N/A"}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-warm">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-warm hover:bg-sand text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedParentId}
            onClick={() => onContinue({
              ...selectedParent,
              hierarchy: selectedParent.path ? selectedParent.path.join(' → ') : selectedParent.name
            })}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </Modal>
  );
}
