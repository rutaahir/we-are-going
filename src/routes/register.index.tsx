import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Upload, User, Eye, EyeOff, Mail, Lock, Phone, Clock, MapPin, Globe, Instagram, Facebook, Youtube, Linkedin, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { calculateAge } from "@/lib/utils";
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageTransition } from "@/components/wag/primitives";

export const Route = createFileRoute("/register/")({
  head: () => ({ meta: [{ title: "Register — WE ARE UNITED" }] }),
  component: Register,
});

const STEPS = ["Personal", "Location", "Education", "Profession", "Community", "Verify"];

function Register() {
  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem("reg_member_step");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [communitiesList, setCommunitiesList] = useState<any[]>([]);
  const navigate = useNavigate();

  // Focus states to make the visual art react to inputs!
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => {
    api.getCommunities().then(res => {
      if (res && res.length > 0) {
        setCommunitiesList(res);
        setFormData((prev: any) => {
          if (!prev.communityId) {
            return {
              ...prev,
              communityId: res[0].id.toString(),
              communityName: res[0].name,
              cState: res[0].state,
              cDistrict: res[0].district,
              cTaluka: res[0].taluka
            };
          }
          return prev;
        });
      }
    }).catch(e => {
      console.warn("Failed to load communities dynamically", e);
    });
  }, []);

  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem("reg_member_draft");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return {
      photo: "", fullName: "", dob: "", gender: "Male", mobile: "", email: "", password: "",
      country: "India", state: "Gujarat", district: "Amreli", taluka: "Rajula", village: "Rampara", address: "",
      school: "", college: "", degree: "", fieldOfStudy: "", passingYear: "",
      professionType: "Job", jobTitle: "", jobType: "", jobTypeOther: "", company: "", industry: "", salary: "",
      jobWorkMode: "On-site", jobCity: "", jobState: "", jobCountry: "India", jobAddress: "",
      businessName: "", businessCategory: "", gstNo: "", businessYears: "",
      businessDesc: "", businessPhone: "", businessWhatsapp: "", businessEmail: "", businessWebsite: "",
      businessAddress: "", businessCity: "", businessState: "", businessPincode: "",
      businessHours: {
        Monday: "09:00 AM - 07:00 PM", Tuesday: "09:00 AM - 07:00 PM",
        Wednesday: "09:00 AM - 07:00 PM", Thursday: "09:00 AM - 07:00 PM",
        Friday: "09:00 AM - 07:00 PM", Saturday: "09:00 AM - 05:00 PM",
        Sunday: "Closed"
      },
      businessInstagram: "", businessFacebook: "", businessYoutube: "", businessLinkedin: "",
      cState: "Gujarat", cDistrict: "Amreli", cTaluka: "Rajula", communityName: "Rampara Ahir Samaj", communityId: "",
      aadhaarNo: "", aadhaarPhoto: ""
    };
  });

  useEffect(() => {
    sessionStorage.setItem("reg_member_draft", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem("reg_member_step", step.toString());
  }, [step]);

  useEffect(() => {
    let isUnloading = false;
    const handleUnload = () => { isUnloading = true; };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (!isUnloading) {
        sessionStorage.removeItem("reg_member_draft");
        sessionStorage.removeItem("reg_member_step");
      }
    };
  }, []);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const updateField = (key: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: val }));
  };

  const [verificationPending, setVerificationPending] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await api.registerVerifyOTP(formData.email, otp);
      toast.success("Email verified successfully!");
      sessionStorage.removeItem("reg_member_draft");
      sessionStorage.removeItem("reg_member_step");
      setVerificationPending(false);
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.registerSendOTP(formData.email);
      toast.success("A new 6-digit OTP has been sent to your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP.");
    }
  };

  const next = async () => {
    if (step === 0) {
      if (!formData.photo) return toast.error("Profile photo is required.");
      if (!formData.fullName.trim()) return toast.error("Full Name is required.");
      if (!/^[a-zA-Z\s]{3,100}$/.test(formData.fullName.trim())) {
        return toast.error("Full Name must be between 3 and 100 characters and contain only letters and spaces.");
      }
      if (!formData.dob) return toast.error("Date of Birth is required.");
      const birthDate = new Date(formData.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) return toast.error("Birthdate cannot be in the future.");

      const calculatedAgeStr = calculateAge(formData.dob);
      const calculatedAge = calculatedAgeStr ? parseInt(calculatedAgeStr, 10) : 0;
      if (calculatedAge < 18) return toast.error("You must be at least 18 years old to register.");

      if (!formData.gender) return toast.error("Gender is required.");

      if (!formData.mobile.trim()) return toast.error("Mobile number is required.");
      if (!/^\d{10}$/.test(formData.mobile.trim())) {
        return toast.error("Mobile number must be exactly 10 digits.");
      }
      if (!formData.email.trim()) return toast.error("Email address is required.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        return toast.error("Please enter a valid email address.");
      }
      if (!formData.password.trim()) return toast.error("Password is required.");
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        return toast.error("Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one number, and one special character.");
      }
    }

    if (step === 1) {
      if (!formData.country) return toast.error("Country is required.");
      if (!formData.state) return toast.error("State is required.");
      if (!formData.district) return toast.error("District is required.");
      if (!formData.taluka) return toast.error("Taluka is required.");
      if (!formData.village) return toast.error("Village is required.");
      if (!formData.address || formData.address.trim().length < 10) {
        return toast.error("Address must be at least 10 characters long.");
      }
    }

    if (step === 2) {
      if (!formData.school || !formData.school.trim()) return toast.error("School is required.");
      if (!formData.degree || !formData.degree.trim()) return toast.error("Degree is required.");
      if (!formData.fieldOfStudy || !formData.fieldOfStudy.trim()) return toast.error("Field of Study is required.");
      if (!formData.passingYear) return toast.error("Passing Year is required.");
      const currentYear = new Date().getFullYear();
      if (parseInt(formData.passingYear, 10) > currentYear) {
        return toast.error("Passing Year cannot be in the future.");
      }
    }

    if (step === 3) {
      if (!formData.professionType) return toast.error("Profession Type is required.");
      if (formData.professionType === "Job") {
        if (!formData.jobTitle || !formData.jobTitle.trim()) return toast.error("Job Title is required.");
        if (!formData.company || !formData.company.trim()) return toast.error("Company is required.");
        if (!formData.industry || !formData.industry.trim()) return toast.error("Industry is required.");
        if (!formData.salary || parseFloat(formData.salary) <= 0) {
          return toast.error("Annual Salary (LPA) must be a positive number.");
        }
      } else {
        if (!formData.businessName || !formData.businessName.trim()) return toast.error("Business Name is required.");
        if (!formData.businessCategory || !formData.businessCategory.trim()) return toast.error("Business Category is required.");
        if (!formData.businessYears) return toast.error("Years in Business is required.");
        const age = calculateAge(formData.dob) ? parseInt(calculateAge(formData.dob)!, 10) : 0;
        if (parseInt(formData.businessYears, 10) > age) {
          return toast.error("Years in Business cannot exceed your age.");
        }
        if (parseInt(formData.businessYears, 10) < 0) {
          return toast.error("Years in Business cannot be negative.");
        }
      }
    }

    if (step === 4) {
      if (!formData.communityId) return toast.error("Please select a community.");
    }

    if (step < STEPS.length - 1) {
      setDir(1);
      setStep(step + 1);
    } else {
      if (!formData.aadhaarNo || !formData.aadhaarNo.trim()) return toast.error("Aadhaar Number is mandatory to complete verification.");
      const cleanAadhaar = formData.aadhaarNo.replace(/[^0-9]/g, "");
      if (cleanAadhaar.length !== 12) return toast.error("Aadhaar Number must be exactly 12 digits.");
      if (!formData.aadhaarPhoto) return toast.error("Please upload your Aadhaar card photo.");

      setIsSubmitting(true);
      try {
        let age = 25;
        if (formData.dob) {
          const calculatedAge = calculateAge(formData.dob);
          age = calculatedAge ? parseInt(calculatedAge, 10) : 25;
        }

        const cleanName = formData.fullName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const username = `${cleanName || "user"}_${Math.floor(100 + Math.random() * 900)}`;

        const fd = new FormData();
        fd.append("username", username);
        fd.append("password", formData.password || "User123!");
        fd.append("email", formData.email || `${username}@example.com`);
        fd.append("name", formData.fullName);
        fd.append("phone", formData.mobile);
        fd.append("gender", formData.gender);
        fd.append("age", String(age));
        fd.append("state", formData.state);
        fd.append("district", formData.district);
        fd.append("taluka", formData.taluka);
        fd.append("village", formData.village || "Rampara");
        fd.append("profession", formData.professionType === "Job" ? formData.jobTitle : formData.businessName);
        fd.append("education", formData.degree || "Graduate");
        fd.append("school", formData.school || "");
        fd.append("college", formData.college || "");
        fd.append("degree", formData.degree || "");
        fd.append("fieldOfStudy", formData.fieldOfStudy || "");
        fd.append("passingYear", formData.passingYear || "");
        fd.append("professionType", formData.professionType);
        fd.append("jobTitle", formData.jobTitle || "");
        fd.append("jobType", formData.jobType === "Other" ? (formData.jobTypeOther || "") : (formData.jobType || ""));
        fd.append("company", formData.company || "");
        fd.append("industry", formData.industry || "");
        fd.append("salary", formData.salary || "");
        fd.append("jobWorkMode", formData.jobWorkMode || "");
        fd.append("jobCity", formData.jobCity || "");
        fd.append("jobState", formData.jobState || "");
        fd.append("jobCountry", formData.jobCountry || "");
        fd.append("jobAddress", formData.jobAddress || "");
        fd.append("businessName", formData.businessName || "");
        fd.append("businessCategory", formData.businessCategory || "");
        fd.append("gstNo", formData.gstNo || "");
        fd.append("businessYears", formData.businessYears || "");
        fd.append("businessDesc", formData.businessDesc || "");
        fd.append("businessPhone", formData.businessPhone || "");
        fd.append("businessWhatsapp", formData.businessWhatsapp || "");
        fd.append("businessEmail", formData.businessEmail || "");
        fd.append("businessWebsite", formData.businessWebsite || "");
        fd.append("businessAddress", formData.businessAddress || "");
        fd.append("businessCity", formData.businessCity || "");
        fd.append("businessState", formData.businessState || "");
        fd.append("businessPincode", formData.businessPincode || "");
        fd.append("businessHours", JSON.stringify(formData.businessHours));
        fd.append("businessInstagram", formData.businessInstagram || "");
        fd.append("businessFacebook", formData.businessFacebook || "");
        fd.append("businessYoutube", formData.businessYoutube || "");
        fd.append("businessLinkedin", formData.businessLinkedin || "");
        fd.append("communityId", String(parseInt(formData.communityId, 10) || 1));
        fd.append("role", "member");
        fd.append("aadhaar", formData.aadhaarNo);

        if (avatarFile) fd.append("avatar", avatarFile);
        if (aadhaarFile) fd.append("aadhaar_photo", aadhaarFile);
        if (logoFile) fd.append("business_logo", logoFile);

        galleryFiles.forEach((file, idx) => {
          fd.append(`business_gallery_${idx}`, file);
        });

        await api.register(fd);
        setVerificationPending(true);
      } catch (err: any) {
        console.error("Member registration failed: ", err);
        toast.error(err.message || "Registration failed. Please make sure the email is unique and backend is running.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const back = () => {
    setDir(-1);
    setStep(s => Math.max(0, s - 1));
  };

  if (verificationPending) {
    return (
      <div className="min-h-screen bg-[#FCF5EC] flex items-center justify-center px-6 font-sans">
        <div className="bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(238,150,80,0.12)] p-10 max-w-md w-full border border-orange-200/50 text-center relative rounded-[32px]">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C1D12] mb-2">Verify Your Email</h2>
          <p className="text-[#7A6455] text-xs sm:text-sm font-semibold mb-6">
            We have sent a 6-digit OTP code to verify your identity.
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-6 text-left">
            <div>
              <label className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block mb-2">
                Registered Email
              </label>
              <input
                type="text"
                readOnly
                value={formData.email}
                className="w-full px-4 py-3 rounded-2xl border border-orange-200/50 bg-orange-50/30 font-semibold text-stone-500 text-sm shadow-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block mb-2">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 rounded-2xl border border-orange-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white font-bold text-stone-800 text-center text-lg tracking-[0.5em] shadow-sm outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp}
              className="relative w-full py-3.5 mt-8 rounded-full bg-gradient-to-r from-[#F25C05] to-[#FFA74D] hover:from-[#E14D02] hover:to-[#FF952B] hover:shadow-[0_12px_40px_rgba(242,92,5,0.45)] focus:outline-none text-white font-extrabold text-[15px] tracking-wide shadow-[0_8px_30px_rgba(242,92,5,0.3)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-75"
            >
              {isVerifyingOtp ? "Verifying..." : "Verify & Activate Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-xs font-bold text-[#EA580C] hover:underline"
            >
              Resend OTP Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (done) return <Success data={formData} onClose={() => navigate({ to: "/login" })} />;

  return (
    <PageTransition>
      <div className="relative min-h-[100dvh] w-full bg-[#FCF5EC] text-[#2C1D12] font-sans flex flex-col justify-between overflow-x-hidden selection:bg-orange-200 lg:h-screen lg:overflow-hidden">

        {/* Absolute Sparkles & Ambient Glows to enrich the visual canvas */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-orange-300 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute top-1/3 right-1/4 w-3.5 h-3.5 bg-[#FFF0DB] rounded-full filter blur-[1px] animate-sparkle"></div>
        <div className="absolute top-[15%] left-[45%] w-2.5 h-2.5 bg-orange-400 rounded-full filter blur-[1px] animate-sparkle" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-[60%] right-[38%] w-3 h-3 bg-white rounded-full filter blur-[1.5px] animate-sparkle" style={{ animationDelay: "1.5s" }}></div>

        {/* TOP HEADER: BRAND IDENTITY */}
        <header className="w-full max-w-7xl mx-auto px-6 lg:px-8 xl:px-12 pt-4 lg:pt-6 md:pt-10 z-20 flex justify-between items-start pointer-events-auto">
          <div className="flex items-center gap-4 transition-transform hover:scale-[1.02] duration-300">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EA580C] flex items-center justify-center shadow-[0_6px_20px_rgba(234,88,12,0.22)]">
              {/* Elegant SVG Triple-person community logo */}
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="7" r="2.5" fill="currentColor" />
                <path d="M7.5 15.5C7.5 13 9.5 11.5 12 11.5C14.5 11.5 16.5 13 16.5 15.5" strokeLinecap="round" strokeWidth="1.8" />
                <circle cx="7.5" cy="9.5" r="1.8" fill="currentColor" className="opacity-80" />
                <path d="M4.5 16C4.5 14.2 5.8 13.2 7.5 13.2" strokeLinecap="round" strokeWidth="1.5" className="opacity-80" />
                <circle cx="16.5" cy="9.5" r="1.8" fill="currentColor" className="opacity-80" />
                <path d="M16.5 13.2C18.2 13.2 19.5 14.2 19.5 16" strokeLinecap="round" strokeWidth="1.5" className="opacity-80" />
              </svg>
              <div className="absolute -inset-0.5 rounded-xl bg-orange-400 opacity-20 filter blur-sm"></div>
            </div>
            <div>
              <h1 className="font-extrabold text-[17px] text-[#3D1A00] tracking-tight leading-none">
                WE ARE UNITED
              </h1>
              <p className="text-[11px] text-[#EA580C] font-semibold mt-1 tracking-wider uppercase">
                Aapni Samaj, Aapnu Network
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-200 bg-white/70 hover:bg-orange-50 hover:border-orange-300 text-[11px] font-bold text-orange-700 transition-all shadow-sm active:scale-95 pointer-events-auto"
          >
            Already have an account? Sign In
          </Link>
        </header>

        {/* MAIN BODY: IMMERSIVE UNIFIED SCENE LAYOUT */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-8 xl:px-12 flex flex-col lg:grid lg:grid-cols-[1.15fr_1fr] gap-8 sm:gap-12 lg:gap-16 items-center justify-center relative z-10 py-6 lg:py-0 lg:overflow-hidden">

          {/* LEFT COLUMN: HIGH-FIDELITY VECTOR SCENE Backdrop + Stepper Timeline */}
          <div className="flex items-center justify-end w-full h-[260px] sm:h-[350px] lg:h-[520px] xl:h-[580px] relative pointer-events-none select-none">

            {/* PROGRESS TIMELINE (Overlayed absolutely on the left of the scene) */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:flex flex-col justify-between z-20 h-[80%] w-32 pointer-events-auto">
              <svg className="absolute left-[24px] top-6 bottom-6 w-12 h-[calc(100%-48px)] -z-10" viewBox="0 0 50 600" preserveAspectRatio="none">
                <path d="M 0 0 Q 30 300 0 600" fill="transparent" stroke="#FFA642" strokeWidth="2" strokeDasharray="6 6" className="opacity-45" />
              </svg>
              {STEPS.map((s, i) => {
                const isActive = step === i;
                const isPast = step > i;
                const curveMargins = ['0px', '8px', '16px', '16px', '8px', '0px'];
                return (
                  <div key={s} className="relative flex items-center gap-3 group" style={{ marginLeft: curveMargins[i] }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 shadow-sm ${isActive
                      ? 'bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white shadow-[0_6px_20px_rgba(234,88,12,0.3)] scale-[1.10] font-extrabold text-[11px]'
                      : isPast
                        ? 'bg-orange-50 text-[#EA580C] border-2 border-orange-200 font-bold text-[11px]'
                        : 'bg-white text-[#7A6455] border border-orange-100 shadow-sm text-[11px]'
                      }`}>
                      {i + 1}
                    </div>
                    <div className={`text-[11px] transition-all duration-500 whitespace-nowrap ${isActive ? 'text-[#EA580C] font-extrabold' : 'text-[#7A6455]/70 font-semibold'}`}>
                      {s}
                    </div>
                  </div>
                );
              }).reverse()}
            </div>

            {/* SVG Backdrop from login page */}
            <svg
              viewBox="0 0 500 550"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-contain filter drop-shadow-[0_12px_45px_rgba(238,150,80,0.12)] overflow-visible transform scale-105 lg:scale-[1.12] xl:scale-[1.2] origin-bottom pr-0 lg:pr-2 xl:pr-4"
            >



              <defs>
                <filter id="softBlur" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" />
                </filter>

                <linearGradient id="doorwaySun" x1="250" y1="210" x2="250" y2="415" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF2DC" />
                  <stop offset="50%" stopColor="#FFA642" />
                  <stop offset="100%" stopColor="#FFF3E0" />
                </linearGradient>

                <linearGradient id="pathGradient" x1="250" y1="415" x2="250" y2="550" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF3E0" />
                  <stop offset="20%" stopColor="#FFA642" />
                  <stop offset="55%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#EA580C" />
                </linearGradient>

                <linearGradient id="portalBevel" x1="160" y1="210" x2="340" y2="210" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ECE0D2" />
                  <stop offset="15%" stopColor="#FFFFFF" />
                  <stop offset="85%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#E4D4C3" />
                </linearGradient>

                <linearGradient id="portalInnerBevel" x1="178" y1="220" x2="322" y2="220" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#D9C3B0" />
                  <stop offset="100%" stopColor="#F9EFE3" />
                </linearGradient>

                <linearGradient id="leafGradLeft" x1="100" y1="300" x2="160" y2="450" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFA74F" />
                  <stop offset="100%" stopColor="#DB5E10" />
                </linearGradient>

                <linearGradient id="leafGradRight" x1="340" y1="300" x2="400" y2="450" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF9C3B" />
                  <stop offset="100%" stopColor="#EB5705" />
                </linearGradient>
              </defs>

              <g>
                {/* 1. SEATING SHADOW under the portal */}
                <ellipse cx="250" cy="415" rx="100" ry="8" fill="#D3BEA8" opacity="0.38" />

                {/* 2. OUTER ARCHWAY FRAME */}
                <path d="M160 415 L160 210 Q160 110 250 110 Q340 110 340 210 L340 415 Z" fill="url(#portalBevel)" />

                {/* 3. INNER ARCH PORTAL FRAME DEPTH */}
                <path d="M178 415 L178 215 Q178 132 250 132 Q322 132 322 215 L322 415 Z" fill="url(#portalInnerBevel)" />

                {/* 4. DOORWAY INTERIOR OPENING / SKY RADIANCE */}
                <path d="M192 415 L192 219 Q192 152 250 152 Q308 152 308 219 L308 415 Z" fill="url(#doorwaySun)" />

                {/* 5. GENTLE SUNLIGHT WAVES */}
                <ellipse cx="250" cy="230" rx="42" ry="34" fill="#FFFBF5" opacity="0.55" />
                <ellipse cx="250" cy="245" rx="28" ry="22" fill="#FFFDFD" opacity="0.45" />

                {/* 6. GOLDEN CITY SKYLINE SILHOUETTE */}
                <g fill="#EA7D1E" opacity="0.45">
                  <rect x="210" y="278" width="8" height="28" rx="0.5" />
                  <rect x="221" y="260" width="10" height="46" rx="0.5" />
                  <rect x="234" y="282" width="6" height="24" rx="0.5" />
                  <rect x="242" y="268" width="9" height="38" rx="0.5" />
                  <rect x="254" y="248" width="13" height="58" rx="0.5" />
                  <rect x="270" y="272" width="7" height="34" rx="0.5" />
                  <rect x="280" y="263" width="9" height="43" rx="0.5" />
                  <rect x="291" y="284" width="6" height="22" rx="0.5" />
                  {/* Spires */}
                  <polygon points="226,260 228.5,248 231,260" />
                  <polygon points="260.5,248 263.5,232 266.5,248" />
                  <polygon points="284.5,263 287.5,249 290.5,263" />
                </g>

                {/* 7. FLYING BIRDS IN PORTAL SKY */}
                <g stroke="#E26A04" strokeWidth="1.2" fill="none" opacity="0.6">
                  <path d="M211 210 Q215 206 219 210 Q223 206 227 210" />
                  <path d="M285 198 Q288 195 291 198 Q294 195 297 198" />
                  <path d="M272 215 Q274 212 277 215 Q280 212 282 215" />
                </g>

                {/* 8. THE WINDING PATHWAY */}
                <path d="M 235 415 L 265 415 C 265 435, 230 445, 230 465 C 230 485, 340 480, 340 510 C 340 530, 350 540, 390 550 L 110 550 C 170 540, 240 530, 240 510 C 240 480, 150 485, 150 465 C 150 445, 235 435, 235 415 Z" fill="#803D0D" opacity="0.14" transform="translate(10, 8)" filter="url(#softBlur)" />
                <path d="M 235 415 L 265 415 C 265 435, 230 445, 230 465 C 230 485, 340 480, 340 510 C 340 530, 350 540, 390 550 L 110 550 C 170 540, 240 530, 240 510 C 240 480, 150 485, 150 465 C 150 445, 235 435, 235 415 Z" fill="url(#pathGradient)" />
                <ellipse cx="250" cy="415" rx="100" ry="4" fill="#602E08" opacity="0.14" filter="url(#softBlur)" />

                {/* 9. LEFT PALM PLANT BRANCH */}
                <g className="animate-swayOrigin" style={{ transformOrigin: "135px 410px" }}>
                  <path d="M135 415 Q140 330 144 285" stroke="#CD5507" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M135 400 Q105 370 95 330 Q122 334 136 368 Z" fill="url(#leafGradLeft)" opacity="0.95" />
                  <path d="M136 380 Q165 352 168 316 Q142 322 136 352 Z" fill="url(#leafGradLeft)" opacity="0.88" />
                  <path d="M138 350 Q106 322 100 286 Q125 292 138 322 Z" fill="url(#leafGradLeft)" opacity="0.85" />
                  <path d="M140 330 Q168 304 172 272 Q148 278 140 306 Z" fill="url(#leafGradLeft)" opacity="0.78" />
                  <path d="M141 310 Q116 284 112 250 Q132 258 141 286 Z" fill="url(#leafGradLeft)" opacity="0.72" />
                  <path d="M143 290 Q126 266 128 238 Q138 245 143 270 Z" fill="url(#leafGradLeft)" opacity="0.65" />
                </g>

                {/* 10. RIGHT PALM PLANT BRANCH */}
                <g className="animate-swayOrigin" style={{ transformOrigin: "365px 410px" }}>
                  <path d="M365 415 Q360 330 356 285" stroke="#CD5507" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M365 400 Q395 370 405 330 Q378 334 364 368 Z" fill="url(#leafGradRight)" opacity="0.95" />
                  <path d="M364 380 Q335 352 332 316 Q358 322 364 352 Z" fill="url(#leafGradRight)" opacity="0.88" />
                  <path d="M362 350 Q394 322 400 286 Q375 292 362 322 Z" fill="url(#leafGradRight)" opacity="0.85" />
                  <path d="M360 330 Q332 304 328 272 Q352 278 360 306 Z" fill="url(#leafGradRight)" opacity="0.78" />
                  <path d="M359 310 Q384 284 388 250 Q368 258 359 286 Z" fill="url(#leafGradRight)" opacity="0.72" />
                  <path d="M357 290 Q374 266 372 238 Q362 245 357 270 Z" fill="url(#leafGradRight)" opacity="0.65" />
                </g>

                {/* 11. LEFT SUSPENDED BADGES: Lock Circle */}
                <g className={isPasswordFocused ? "animate-bounce" : "animate-float"} style={{ transition: "all 0.5s ease" }}>
                  <path d="M125 150 Q115 110 130 95 Q135 112 128 135" stroke="#E26A04" strokeWidth="1.5" fill="none" opacity="0.5" />
                  <path d="M130 95 C122 110, 115 130, 126 154 C132 135, 138 120, 130 95 Z" fill="#FFA539" opacity="0.45" />
                  <path d="M128 155 Q115 220, 110 270" stroke="#DA7D1E" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 4.5" opacity="0.5" />
                  <path d="M110 270 Q105 320, 122 360" stroke="#DA7D1E" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 4.5" opacity="0.5" />
                  <circle cx="110" cy="270" r="18" fill="white" className="shadow-lg" />
                  <circle cx="110" cy="270" r="14" fill="#FFEFE0" />
                  <rect x="104" y="270" width="12" height="10" rx="1.8" fill="#F87313" />
                  <path d="M106.5 270 L106.5 266.5 Q106.5 262.5 110 262.5 Q113.5 262.5 113.5 266.5 L113.5 270" stroke="#F87313" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  <circle cx="110" cy="275" r="1" fill="white" />
                </g>

                {/* 12. RIGHT SUSPENDED BADGE: Avatar Circle */}
                <g className={isEmailFocused ? "animate-bounce" : "animate-float-slow"} style={{ transition: "all 0.5s ease" }}>
                  <path d="M380 180 Q305 240, 312 310" stroke="#DA7D1E" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="3 5" opacity="0.5" />
                  <circle cx="380" cy="180" r="24" fill="white" className="shadow-md" />
                  <circle cx="380" cy="180" r="19" fill="#FFF4E6" />
                  <circle cx="380" cy="174" r="6" fill="#F87313" opacity="0.82" />
                  <ellipse cx="380" cy="189" rx="10" ry="6" fill="#F87313" opacity="0.65" />
                </g>

                {/* 13. ADDITIONAL ORNAMENTAL BUSHES GIVING STABILITY */}
                <ellipse cx="85" cy="420" rx="36" ry="14" fill="#FFA539" opacity="0.25" />
                <ellipse cx="415" cy="420" rx="36" ry="14" fill="#FFA539" opacity="0.25" />
              </g>
            </svg>

          </div>

          {/* RIGHT COLUMN: CORE REGISTER FLOATING FORM */}
          <div className="flex flex-col justify-between h-full lg:h-full lg:overflow-y-auto custom-scrollbar w-full max-w-[480px] mx-auto py-4 z-10">
            <div className="my-auto pb-6">

              <div className="text-center mb-6">
                <div className="text-[#EA580C] text-[10px] font-extrabold mb-1 tracking-widest uppercase">Step {step + 1} of 6</div>
                <h2 className="text-2xl font-serif text-[#2C1D12] font-bold">{STEPS[step]} Details</h2>
                <div className="flex justify-center mt-2">
                  <svg width="60" height="8" viewBox="0 0 60 8">
                    <path d="M0 4 H25 M35 4 H60 M30 1 L33 4 L30 7 L27 4 Z" fill="#FFA642" stroke="#FFA642" />
                  </svg>
                </div>
              </div>

              <div className="w-full">
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div key={step} custom={dir}
                    initial={{ x: dir > 0 ? 30 : -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: dir > 0 ? -30 : 30, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="space-y-5"
                  >
                    {step === 0 && (
                      <Personal
                        data={formData}
                        onChange={updateField}
                        setIsEmailFocused={setIsEmailFocused}
                        setIsPasswordFocused={setIsPasswordFocused}
                        avatarFile={avatarFile}
                        setAvatarFile={setAvatarFile}
                      />
                    )}
                    {step === 1 && <LocationStep data={formData} onChange={updateField} />}
                    {step === 2 && <Education data={formData} onChange={updateField} />}
                    {step === 3 && (
                      <Profession
                        data={formData}
                        onChange={updateField}
                        logoFile={logoFile}
                        setLogoFile={setLogoFile}
                        galleryFiles={galleryFiles}
                        setGalleryFiles={setGalleryFiles}
                        galleryPreviews={galleryPreviews}
                        setGalleryPreviews={setGalleryPreviews}
                      />
                    )}
                    {step === 4 && <Community data={formData} onChange={updateField} communities={communitiesList} />}
                    {step === 5 && (
                      <Verify
                        data={formData}
                        onChange={updateField}
                        aadhaarFile={aadhaarFile}
                        setAadhaarFile={setAadhaarFile}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* ACTIONS */}
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-orange-100">
                  <button
                    onClick={back}
                    disabled={step === 0 || isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-orange-200 bg-white/70 hover:bg-orange-50 hover:border-orange-300 text-[11px] font-bold text-orange-700 transition-all shadow-sm active:scale-95 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-orange-500" />
                    Back
                  </button>
                  <button
                    onClick={next}
                    disabled={isSubmitting}
                    className="relative px-8 py-3 rounded-full bg-gradient-to-r from-[#F25C05] to-[#FFA74D] hover:from-[#E14D02] hover:to-[#FF952B] hover:shadow-[0_12px_40px_rgba(242,92,5,0.45)] focus:outline-none text-white font-extrabold text-sm tracking-wide shadow-[0_8px_30px_rgba(242,92,5,0.3)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 group disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                      {isSubmitting ? "Submitting..." : step === STEPS.length - 1 ? "Submit" : "Next Step"}
                    </span>
                    {!isSubmitting && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />}
                    <div className="absolute top-1.5 right-6 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-0 group-hover:opacity-100 duration-500"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </main>

        {/* FOOTER AREA */}
        <footer className="w-full max-w-7xl mx-auto px-6 lg:px-8 xl:px-12 py-4 lg:py-6 z-20 flex flex-col md:flex-row justify-between items-center text-[#7A6455] text-[11px] font-semibold gap-2 mt-auto">
          <p className="tracking-wide">
            © 2026 WE ARE UNITED. All rights reserved.
          </p>
          <p className="opacity-75 hidden md:block">
            Gujarati Community Network
          </p>
        </footer>

      </div>
    </PageTransition>
  );
}

const BlobInput = ({ label, icon: Icon, value, onChange, suffix, ...p }: any) => {
  return (
    <div className="flex items-center gap-3 bg-white/60 hover:bg-white/80 border border-[#E6D9C8] rounded-2xl p-3 px-4 transition-all focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-[#EA580C] focus-within:bg-white w-full">
      {Icon && <Icon className="w-5 h-5 text-[#7A6455]/65 shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider block leading-tight">
          {label}
        </span>
        <input
          value={value || ""}
          onChange={onChange}
          className="w-full bg-transparent border-none outline-none text-sm text-[#2C1D12] font-bold p-0 focus:ring-0 mt-0.5"
          placeholder=""
          {...p}
        />
      </div>
      {suffix && <div className="shrink-0">{suffix}</div>}
    </div>
  );
};

type SelectOption = string | { value: string; label: string };

const BlobSelect = ({
  label, options, value, onChange, placeholder
}: {
  label: string; options: SelectOption[]; value: string; onChange: (val: string) => void; placeholder?: string
}) => {
  return (
    <div className="bg-white/60 hover:bg-white/80 border border-[#E6D9C8] rounded-2xl p-3 px-4 transition-all focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-[#EA580C] focus-within:bg-white w-full">
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider block leading-tight">
          {label}
        </span>
        <RadixSelect
          value={value || undefined}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-full bg-transparent border-none outline-none shadow-none focus:ring-0 p-0 text-sm text-[#2C1D12] font-bold flex items-center justify-between h-auto mt-0.5">
            <SelectValue placeholder={placeholder || `Select ${label}`} />
          </SelectTrigger>
          <SelectContent className="max-h-[250px] overflow-y-auto bg-white border border-orange-100 rounded-2xl shadow-xl p-1 z-[100]">
            {options.map((o) => {
              const val = typeof o === "string" ? o : o.value;
              const lbl = typeof o === "string" ? o : o.label;
              return (
                <SelectItem key={val} value={val} className="rounded-xl focus:bg-orange-50 focus:text-orange-700 cursor-pointer py-2">
                  {lbl}
                </SelectItem>
              );
            })}
          </SelectContent>
        </RadixSelect>
      </div>
    </div>
  );
};

const BlobDateOfBirth = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [year, month, day] = value ? value.split("-") : ["", "", ""];

  const update = (y: string, m: string, d: string) => {
    onChange(`${y || new Date().getFullYear().toString()}-${m ? m.padStart(2, "0") : "01"}-${d ? d.padStart(2, "0") : "01"}`);
  };

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = [
    { value: "1", label: "Jan" }, { value: "2", label: "Feb" }, { value: "3", label: "Mar" },
    { value: "4", label: "Apr" }, { value: "5", label: "May" }, { value: "6", label: "Jun" },
    { value: "7", label: "Jul" }, { value: "8", label: "Aug" }, { value: "9", label: "Sep" },
    { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" }
  ];
  const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <div className="bg-white/60 hover:bg-white/80 border border-[#E6D9C8] rounded-2xl p-3 px-4 transition-all focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-[#EA580C] focus-within:bg-white w-full">
      <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider block leading-tight">
        Date of Birth
      </span>
      <div className="flex gap-4 items-center mt-0.5 divide-x divide-[#E6D9C8]/60">
        <RadixSelect
          value={day ? String(parseInt(day, 10)) : undefined}
          onValueChange={(d) => update(year, month, d)}
        >
          <SelectTrigger className="flex-1 bg-transparent border-none outline-none shadow-none focus:ring-0 p-0 text-sm text-[#2C1D12] font-bold flex items-center justify-between h-auto">
            <SelectValue placeholder="DD" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto bg-white border border-orange-100 rounded-xl shadow-xl z-[100]">
            {days.map((d) => <SelectItem key={d} value={d} className="rounded-lg">{d}</SelectItem>)}
          </SelectContent>
        </RadixSelect>

        <RadixSelect
          value={month ? String(parseInt(month, 10)) : undefined}
          onValueChange={(m) => update(year, m, day)}
        >
          <SelectTrigger className="flex-1 bg-transparent border-none outline-none shadow-none focus:ring-0 p-0 pl-3 text-sm text-[#2C1D12] font-bold flex items-center justify-between h-auto">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto bg-white border border-orange-100 rounded-xl shadow-xl z-[100]">
            {months.map((m) => <SelectItem key={m.value} value={m.value} className="rounded-lg">{m.label}</SelectItem>)}
          </SelectContent>
        </RadixSelect>

        <RadixSelect
          value={year || undefined}
          onValueChange={(y) => update(y, month, day)}
        >
          <SelectTrigger className="flex-[1.2] bg-transparent border-none outline-none shadow-none focus:ring-0 p-0 pl-3 text-sm text-[#2C1D12] font-bold flex items-center justify-between h-auto">
            <SelectValue placeholder="YYYY" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto bg-white border border-orange-100 rounded-xl shadow-xl z-[100]">
            {years.map((y) => <SelectItem key={y} value={y} className="rounded-lg">{y}</SelectItem>)}
          </SelectContent>
        </RadixSelect>
      </div>
    </div>
  );
};

function Personal({
  data, onChange, setIsEmailFocused, setIsPasswordFocused, avatarFile, setAvatarFile
}: {
  data: any; onChange: (key: string, val: any) => void;
  setIsEmailFocused: (val: boolean) => void;
  setIsPasswordFocused: (val: boolean) => void;
  avatarFile: File | null;
  setAvatarFile: (f: File | null) => void;
}) {
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-8">
        <label className="cursor-pointer group flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-[0_8px_30px_rgba(238,150,80,0.15)] flex items-center justify-center overflow-hidden transition-all group-hover:scale-[1.02] duration-300">
              {data.photo ? <img src={data.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-[#7A6455]/40" />}
              <div className="absolute inset-0 bg-[#EA580C]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#FB923C] to-[#EA580C] flex items-center justify-center text-white shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-3.5 h-3.5" />
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0];
            if (f) {
              setAvatarFile(f);
              onChange("photo", URL.createObjectURL(f));
            }
          }} />

          <div className="flex flex-col justify-center">
            <h3 className="text-[#2C1D12] font-extrabold text-base tracking-tight">Upload photo</h3>
            <p className="text-[11px] text-[#EA580C] font-semibold mt-1 uppercase tracking-wider">JPG, PNG (Max 5MB)</p>
          </div>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
        <BlobInput label="Full Name" placeholder="" value={data.fullName} onChange={(e: any) => onChange("fullName", e.target.value)} icon={User} />
        <BlobDateOfBirth value={data.dob} onChange={(val: string) => onChange("dob", val)} />
      </div>

      <div className="w-full">
        <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider block mb-1.5 ml-1">Gender</span>
        <div className="flex items-center w-full p-1 bg-white/60 border border-[#E6D9C8] rounded-2xl shadow-xs">
          {["Male", "Female", "Other"].map(g => (
            <button key={g} type="button" onClick={() => onChange("gender", g)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${data.gender === g ? "bg-gradient-to-r from-[#F25C05] to-[#FFA74D] text-white shadow-sm" : "text-[#7A6455]/70 hover:bg-orange-50/50 hover:text-[#2C1D12]"}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
        <BlobInput
          label="Mobile Number"
          placeholder=""
          value={data.mobile}
          onChange={(e: any) => onChange("mobile", e.target.value)}
          icon={Phone}
          onFocus={() => setIsEmailFocused(true)}
          onBlur={() => setIsEmailFocused(false)}
        />
        <BlobInput
          label="Email Address"
          type="email"
          placeholder=""
          value={data.email}
          onChange={(e: any) => onChange("email", e.target.value)}
          icon={Mail}
          onFocus={() => setIsEmailFocused(true)}
          onBlur={() => setIsEmailFocused(false)}
        />
      </div>

      <div className="relative">
        <BlobInput
          label="Password"
          type={showPwd ? "text" : "password"}
          placeholder=""
          value={data.password || ""}
          onChange={(e: any) => onChange("password", e.target.value)}
          icon={Lock}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
          suffix={
            <button
              type="button"
              className="p-1 rounded-md text-[#7A6455] hover:text-[#EA580C] hover:bg-orange-50 transition-colors pointer-events-auto"
              onClick={() => setShowPwd(!showPwd)}
            >
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
        />
        {data.password && (() => {
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
          const strObj = getPasswordStrength(data.password);
          return (
            <div className="mt-2 px-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-1">
                <span className="text-[#7A6455]">Password Strength</span>
                <span className={strObj.text}>{strObj.label}</span>
              </div>
              <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
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
  );
}

const DISTRICTS_OF_STATE: Record<string, string[]> = {
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Arunachal Pradesh": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey", "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley", "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup Metropolitan", "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Dima Hasao", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran (Motihari)", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur (Bhabua)", "Katihar", "Khagaria", "Kishanjganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger (Monghyr)", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia (Purnea)", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chandigarh (UT)": ["Chandigarh"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada (South Bastar)", "Dhamtari", "Durg", "Gariyaband", "Janjgir-Champa", "Jashpur", "Kabirdham (Kawardha)", "Kanker (North Bastar)", "Kondagaon", "Korba", "Korea (Koriya)", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Dadra and Nagar Haveli (UT)": ["Dadra & Nagar Haveli"],
  "Daman and Diu (UT)": ["Daman", "Diu"],
  "Delhi (NCT)": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East  Delhi", "North West  Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West  Delhi", "West Delhi"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha (Palanpur)", "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dangs (Ahwa)", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kachchh", "Kheda (Nadiad)", "Mahisagar", "Mehsana", "Morbi", "Narmada (Rajpipla)", "Navsari", "Panchmahal (Godhra)", "Patan", "Porbandar", "Rajkot", "Sabarkantha (Himmatnagar)", "Surat", "Surendranagar", "Tapi (Vyara)", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurgaon", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Mewat", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul & Spiti", "Mandi", "Shimla", "Sirmaur (Sirmour)", "Solan", "Una"],
  "Jammu and Kashmir": ["Anantnag", "Bandipore", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kargil", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Leh", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribag", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela-Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkot", "Ballari (Bellary)", "Belagavi (Belgaum)", "Bengaluru (Bangalore) Rural", "Bengaluru (Bangalore) Urban", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru (Chikmagalur)", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi (Gulbarga)", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru (Mysore)", "Raichur", "Ramanagara", "Shivamogga (Shimoga)", "Tumakuru (Tumkur)", "Udupi", "Uttara Kannada (Karwar)", "Vijayapura (Bijapur)", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Lakshadweep (UT)": ["Agatti", "Amini", "Androth", "Bithra", "Chethlath", "Kavaratti", "Kadmath", "Kalpeni", "Kilthan", "Minicoy"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"],
  "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deoghar", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghapur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar (Keonjhar)", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Sonepur", "Sundargarh"],
  "Puducherry (UT)": ["Karaikal", "Mahe", "Pondicherry", "Yanam"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Nawanshahr (Shahid Bhagat Singh Nagar)", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar (Mohali)", "Sangrur", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
  "Tamil Nadu": ["Ariyalur", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Salem", "Sivaganga", "Thanjavur", "Theni", "Thoothukudi (Tuticorin)", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhoopalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal (Rural)", "Warangal (Urban)", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi (Chatrapati Sahuji Mahraj Nagar)", "Amroha (J.P. Nagar)", "Auraiya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur (Panchsheel Nagar)", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kanshiram Nagar (Kasganj)", "Kaushambi", "Kushinagar (Padrauna)", "Lakhimpur - Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "RaeBareli", "Rampur", "Saharanpur", "Sambhal (Bhim Nagar)", "Sant Kabir Nagar", "Shahjahanpur", "Shamali (Prabuddh Nagar)", "Shravasti", "Siddharth Nagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Burdwan (Bardhaman)", "Cooch Behar", "Dakshin Dinajpur (South Dinajpur)", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Kalimpong", "Kolkata", "Malda", "Mursibad", "Nadia", "North 24 Parganas", "Paschim Medinipur (West Medinipur)", "Purba Medinipur (East Medinipur)", "Purulia", "South 24 Parganas", "Uttar Dinajpur (North Dinajpur)"]
};

const STATES_OF_INDIA = Object.keys(DISTRICTS_OF_STATE);

const LOCATION_DATA: Record<string, string[]> = {
  "India": STATES_OF_INDIA,
  "United States": ["California", "New York", "Texas", "Florida", "Illinois"],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  "Canada": ["Ontario", "Quebec", "British Columbia", "Alberta"],
  "Australia": ["New South Wales", "Victoria", "Queensland", "Western Australia"],
  "United Arab Emirates": ["Abu Dhabi", "Dubai", "Sharjah", "Ajman"]
};

const TALUKAS_OF_DISTRICT: Record<string, string[]> = {
  "Amreli": ["Rajula", "Khambha", "Una", "Jafrabad", "Amreli", "Babra", "Lathi", "Liliya", "Dhari", "Kunkavav", "Savar Kundla"],
  "Surat": ["Choryasi", "Kamrej", "Olpad", "Palsana", "Bardoli", "Mahuva", "Mandvi", "Mangrol", "Umarpada"],
  "Ahmedabad": ["City", "Daskroi", "Sanand", "Viramgam", "Dholka", "Dhandhuka", "Bavla", "Detroj", "Mandal"],
  "Rajkot": ["Rajkot", "Gondal", "Jetpur", "Morbi", "Wankaner", "Dhoraji", "Kotda Sangani", "Jasdan", "Lodhika", "Upleta"],
  "Bhavnagar": ["Bhavnagar", "Mahuva", "Taja", "Palitana", "Gariadhar", "Sihor", "Umrala", "Vallabhipur", "Jeshawada"],
  "Vadodara": ["Vadodara", "Dabhoi", "Karjan", "Padra", "Savli", "Sinor", "Waghodia"],
  "Gandhinagar": ["Gandhinagar", "Kalol", "Dehgam", "Mansa"],

  "Mumbai": ["Mumbai City", "Mumbai Suburban"],
  "Pune": ["Pune City", "Haveli", "Baramati", "Shirur", "Maval", "Khed", "Junner", "Ambegaon", "Indapur", "Daund"],
  "Thane": ["Thane", "Kalyan", "Ulhasnagar", "Bhiwandi", "Shahapur", "Murbad", "Ambarnath"],
  "Nagpur": ["Nagpur Urban", "Nagpur Rural", "Kamptee", "Katol", "Ramtek", "Saoner", "Umred"],

  "Jaipur": ["Jaipur", "Sanganer", "Amer", "Chomu", "Phulera", "Bass", "Jamwa Ramgarh", "Kotputli"],
  "Jodhpur": ["Jodhpur", "Luni", "Bilara", "Shergarh", "Osian", "Phalodi", "Piparcity"],

  "New Delhi": ["Chanakyapuri", "Delhi Cantonment", "Vasant Vihar"],
  "South Delhi": ["Saket", "Hauz Khas", "Mehrauli"]
};

const VILLAGES_OF_TALUKA: Record<string, string[]> = {
  "Rajula": ["Rampara", "Rajula", "Kovaya", "Hindorna", "Victor", "Vavera", "Zanpath", "Pipavav"],
  "Khambha": ["Khambha", "Dedan", "Raydi", "Nani Dhari", "Bhad", "Kantala", "Tulsishyam", "Dhavadiya"],
  "Una": ["Una", "Delvada", "Kanek", "Simar", "Gadhada", "Dhamlej", "Vansaj", "Sana"],
  "Jafrabad": ["Jafrabad", "Lunsapur", "Varahswarup", "Shiyalbet", "Vadhera", "Babra", "Sarkleshwar"],
  "Amreli": ["Amreli", "Chital", "Babra", "Lathi", "Liliya", "Gavadka", "Devrajia", "Haripura"],

  "Choryasi": ["Surat", "Dumas", "Hazira", "Bhatha", "Sarsana", "Ichhapore", "Suvali"],
  "Kamrej": ["Kamrej", "Kholvad", "Kathor", "Vav", "Valak", "Laskana", "Netrang"],
  "Olpad": ["Olpad", "Sayan", "Karanj", "Kim", "Mulad", "Saras", "Ten"],

  "City": ["Ahmedabad City", "Vastrapur", "Satellite", "Bodakdev", "Thaltej", "Ghatlodia", "Girdharnagar"],
  "Sanand": ["Sanand", "Changodar", "Nalsarovar", "Iyava", "Moti Devti", "Shela", "Telav"],
  "Daskroi": ["Bareja", "Gatrad", "Jetalpur", "Kasindra", "Lambha", "Aslali", "Kuha"],

  "Rajkot": ["Rajkot City", "Madhapar", "Mavdi", "Kotharia", "Shapar", "Veraval", "Metoda"],
  "Gondal": ["Gondal", "Ribda", "Virpur", "Moti Marad", "Bhojpara", "Gundala", "Hadamtala"],

  "Pune City": ["Kothrud", "Shivajinagar", "Aundh", "Hadapsar", "Viman Nagar", "Kalyani Nagar", "Koregaon Park"],
  "Haveli": ["Wagholi", "Hadapsar", "Kondhwa", "Dhanori", "Fursungi", "Pisoli", "Undri"],

  "Jaipur": ["Jaipur City", "Mansarovar", "Malviya Nagar", "Vaishali Nagar", "C-Scheme", "Raja Park"],
  "Sanganer": ["Sanganer", "Pratap Nagar", "Jagatpura", "Sitapura", "Muhana", "Watika"]
};

function LocationStep({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) {
  const [showCustomTaluka, setShowCustomTaluka] = useState(false);
  const [showCustomVillage, setShowCustomVillage] = useState(false);

  const states = LOCATION_DATA[data.country] || [];
  const districts = DISTRICTS_OF_STATE[data.state] || [`${data.state} District 1`, `${data.state} District 2`];
  const talukas = TALUKAS_OF_DISTRICT[data.district] || [`${data.district} Taluka 1`, `${data.district} Taluka 2`];
  const villages = data.taluka ? (VILLAGES_OF_TALUKA[data.taluka] || [`${data.taluka} Village 1`, `${data.taluka} Village 2`]) : [];

  const handleCountryChange = (val: string) => { onChange("country", val); handleStateChangeInternal(val, LOCATION_DATA[val]?.[0] || ""); };
  const handleStateChangeInternal = (countryVal: string, stateVal: string) => { onChange("state", stateVal); handleDistrictChangeInternal(countryVal, stateVal, (DISTRICTS_OF_STATE[stateVal] || [`${stateVal} District 1`])[0] || ""); };
  const handleStateChange = (val: string) => handleStateChangeInternal(data.country, val);
  const handleDistrictChangeInternal = (countryVal: string, stateVal: string, districtVal: string) => { onChange("district", districtVal); handleTalukaChangeInternal((TALUKAS_OF_DISTRICT[districtVal] || [`${districtVal} Taluka 1`])[0] || ""); };
  const handleDistrictChange = (val: string) => handleDistrictChangeInternal(data.country, data.state, val);

  const handleTalukaChangeInternal = (talukaVal: string) => {
    if (talukaVal === "Other (Type Custom)") { setShowCustomTaluka(true); onChange("taluka", ""); onChange("village", ""); }
    else { setShowCustomTaluka(false); onChange("taluka", talukaVal); onChange("village", (VILLAGES_OF_TALUKA[talukaVal] || [`${talukaVal} Village 1`])[0] || ""); }
  };
  const handleTalukaChange = (val: string) => handleTalukaChangeInternal(val);

  const handleVillageChange = (val: string) => {
    if (val === "Other (Type Custom)") { setShowCustomVillage(true); onChange("village", ""); }
    else { setShowCustomVillage(false); onChange("village", val); }
  };

  const talukaOptions = [...talukas, "Other (Type Custom)"];
  const villageOptions = [...villages, "Other (Type Custom)"];

  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
        <BlobSelect label="Country" options={Object.keys(LOCATION_DATA)} value={data.country} onChange={handleCountryChange} />
        <BlobSelect label="State" options={states} value={data.state} onChange={handleStateChange} />
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
        <BlobSelect label="District" options={districts} value={data.district} onChange={handleDistrictChange} />
        {showCustomTaluka ? (
          <div>
            <BlobInput label="Taluka (Custom)" placeholder="" value={data.taluka} onChange={(e: any) => onChange("taluka", e.target.value)} />
            <button type="button" onClick={() => handleTalukaChangeInternal(talukas[0] || "")} className="text-[12px] font-bold text-[#EA580C] hover:underline mt-2 ml-2">← Select from list</button>
          </div>
        ) : (
          <BlobSelect label="Taluka" options={talukaOptions} value={data.taluka} onChange={handleTalukaChange} />
        )}
      </div>

      {showCustomVillage ? (
        <div>
          <BlobInput label="Village (Custom)" placeholder="" value={data.village} onChange={(e: any) => onChange("village", e.target.value)} />
          <button type="button" onClick={() => handleVillageChange(villages[0] || "")} className="text-[12px] font-bold text-[#EA580C] hover:underline mt-2 ml-2">← Select from list</button>
        </div>
      ) : (
        <BlobSelect label="Village" options={villageOptions} value={data.village} onChange={handleVillageChange} />
      )}

      <div className="bg-white/60 hover:bg-white/80 border border-[#E6D9C8] rounded-2xl p-3 px-4 transition-all focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-[#EA580C] focus-within:bg-white w-full">
        <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider block leading-tight">
          Full Address
        </span>
        <textarea
          rows={2}
          className="w-full bg-transparent border-none outline-none text-sm text-[#2C1D12] font-bold p-0 focus:ring-0 mt-1 resize-none"
          placeholder="Enter your full home address"
          value={data.address}
          onChange={(e: any) => onChange("address", e.target.value)}
        />
      </div>
    </div>
  );
}

function Education({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
      <BlobInput label="School" value={data.school} onChange={(e: any) => onChange("school", e.target.value)} placeholder="" />
      <BlobInput label="College" value={data.college} onChange={(e: any) => onChange("college", e.target.value)} placeholder="" />
      <BlobInput label="Degree" value={data.degree} onChange={(e: any) => onChange("degree", e.target.value)} placeholder="" />
      <BlobInput label="Field of Study" value={data.fieldOfStudy} onChange={(e: any) => onChange("fieldOfStudy", e.target.value)} placeholder="" />
      <BlobInput label="Passing Year" type="number" value={data.passingYear} onChange={(e: any) => onChange("passingYear", e.target.value)} placeholder="" />
    </div>
  );
}

const BIZ_CATEGORIES_REG = [
  "Food & Bakery", "Manufacturing", "Jewellery", "Healthcare", "Textile",
  "Construction", "Automobile", "Professional", "Education", "Technology",
  "Retail", "Agriculture", "Finance", "Transport", "Other"
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_OPTIONS = [
  "Closed", "Open 24 Hours",
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM"
];

function Profession({
  data,
  onChange,
  logoFile,
  setLogoFile,
  galleryFiles,
  setGalleryFiles,
  galleryPreviews,
  setGalleryPreviews
}: {
  data: any;
  onChange: (key: string, val: any) => void;
  logoFile: File | null;
  setLogoFile: (f: File | null) => void;
  galleryFiles: File[];
  setGalleryFiles: (files: File[]) => void;
  galleryPreviews: string[];
  setGalleryPreviews: (previews: string[]) => void;
}) {
  const [bizTab, setBizTab] = useState<"basic" | "contact" | "hours">("basic");

  const updateHours = (day: string, val: string) => {
    onChange("businessHours", { ...data.businessHours, [day]: val });
  };

  const parseHour = (dayVal: string, part: "open" | "close") => {
    if (!dayVal || dayVal === "Closed" || dayVal === "Open 24 Hours") return "";
    const parts = dayVal.split(" - ");
    return part === "open" ? (parts[0] || "") : (parts[1] || "");
  };

  const setHourPart = (day: string, part: "open" | "close", val: string) => {
    const current = data.businessHours?.[day] || "";
    if (val === "Closed" || val === "Open 24 Hours") {
      updateHours(day, val);
      return;
    }
    const open = part === "open" ? val : parseHour(current, "open");
    const close = part === "close" ? val : parseHour(current, "close");
    if (open && close) updateHours(day, `${open} - ${close}`);
    else if (open) updateHours(day, open);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...galleryFiles, ...files].slice(0, 10);
    setGalleryFiles(newFiles);
    setGalleryPreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const removeGalleryPhoto = (index: number) => {
    const newFiles = galleryFiles.filter((_, i) => i !== index);
    setGalleryFiles(newFiles);
    setGalleryPreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  return (
    <div className="space-y-5">
      {/* Profession Type Toggle */}
      <div className="relative w-full">
        <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block mb-2">Profession Type</span>
        <div className="flex items-center w-full p-1 bg-white border border-[#E6D9C8] rounded-full shadow-sm">
          {(["Job", "Business"] as const).map(x => (
            <button key={x} type="button" onClick={() => onChange("professionType", x)}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all duration-300 ${data.professionType === x
                  ? "bg-gradient-to-r from-[#F25C05] to-[#FFA74D] text-white shadow-sm"
                  : "text-[#7A6455] hover:bg-orange-50 hover:text-orange-900"
                }`}>
              {x}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {data.professionType === "Job" ? (
          <motion.div key="job" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid sm:grid-cols-2 gap-x-6 gap-y-5">

            {/* Row 1: Job Title + Job Type */}
            <BlobInput label="Job Title" value={data.jobTitle} onChange={(e: any) => onChange("jobTitle", e.target.value)} placeholder="" />
            <div className="flex flex-col gap-2">
              <BlobSelect
                label="Job Type / Profession"
                options={[
                  "IT & Software", "Engineering", "Healthcare & Medical", "Education & Teaching",
                  "Finance & Accounting", "Sales & Marketing", "Government & Defence", "Legal",
                  "Agriculture & Farming", "Construction & Real Estate", "Retail & Commerce",
                  "Media & Entertainment", "Hospitality & Tourism", "Transport & Logistics",
                  "Manufacturing", "Research & Science", "Arts & Design", "Other"
                ]}
                value={data.jobType || ""}
                onChange={(val: string) => { onChange("jobType", val); if (val !== "Other") onChange("jobTypeOther", ""); }}
              />
              {data.jobType === "Other" && (
                <BlobInput
                  label="Specify Job Type"
                  value={data.jobTypeOther || ""}
                  onChange={(e: any) => onChange("jobTypeOther", e.target.value)}
                  placeholder="e.g. Event Planner, Astrologer..."
                />
              )}
            </div>

            {/* Row 2: Company + Industry */}
            <BlobInput label="Company" value={data.company} onChange={(e: any) => onChange("company", e.target.value)} placeholder="" />
            <BlobInput label="Industry" value={data.industry} onChange={(e: any) => onChange("industry", e.target.value)} placeholder="" />

            {/* Row 3: Annual Salary + Work Mode */}
            <BlobInput label="Annual Salary (LPA)" type="number" value={data.salary} onChange={(e: any) => onChange("salary", e.target.value)} placeholder="" />
            <BlobSelect
              label="Work Mode"
              options={["On-site", "Remote", "Hybrid"]}
              value={data.jobWorkMode || "On-site"}
              onChange={(val: string) => onChange("jobWorkMode", val)}
            />

            {/* Job Location Section Header */}
            <div className="sm:col-span-2">
              <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block mb-0">Job Location</span>
              <div className="h-px bg-orange-100 mt-1" />
            </div>

            {/* Row 4: Job City + Job State */}
            <BlobInput label="Job City" value={data.jobCity || ""} onChange={(e: any) => onChange("jobCity", e.target.value)} placeholder="e.g. Ahmedabad" />
            <BlobInput label="Job State" value={data.jobState || ""} onChange={(e: any) => onChange("jobState", e.target.value)} placeholder="e.g. Gujarat" />

            {/* Row 5: Job Country + Job Full Address */}
            <BlobSelect
              label="Job Country"
              options={["India", "United States", "United Kingdom", "Canada", "Australia", "United Arab Emirates", "Other"]}
              value={data.jobCountry || "India"}
              onChange={(val: string) => onChange("jobCountry", val)}
            />
            <div className="bg-white/60 hover:bg-white/80 border border-[#E6D9C8] rounded-2xl p-3 px-4 transition-all focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-[#EA580C] focus-within:bg-white w-full">
              <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider block leading-tight">Job Address</span>
              <textarea
                rows={2}
                className="w-full bg-transparent border-none outline-none text-sm text-[#2C1D12] font-bold p-0 focus:ring-0 mt-1 resize-none"
                placeholder="Office / workplace full address"
                value={data.jobAddress || ""}
                onChange={(e: any) => onChange("jobAddress", e.target.value)}
              />
            </div>

          </motion.div>
        ) : (
          <motion.div key="business" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex gap-1 bg-orange-50/60 border border-[#E6D9C8] rounded-2xl p-1">
              {(["basic", "contact", "hours"] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setBizTab(tab)}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${bizTab === tab
                      ? "bg-gradient-to-r from-[#F25C05] to-[#FFA74D] text-white shadow-sm"
                      : "text-[#7A6455] hover:text-[#EA580C]"
                    }`}>
                  {tab === "basic" ? "Basic Info" : tab === "contact" ? "Contact & Location" : "Hours & Socials"}
                </button>
              ))}
            </div>

            {/* TAB: Basic Info */}
            {bizTab === "basic" && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <BlobInput label="Business / Shop Name *" value={data.businessName} onChange={(e: any) => onChange("businessName", e.target.value)} placeholder="" />
                  <BlobSelect label="Category / Sector *" options={BIZ_CATEGORIES_REG} value={data.businessCategory} onChange={v => onChange("businessCategory", v)} />
                  <BlobInput label="GST Number" value={data.gstNo} onChange={(e: any) => onChange("gstNo", e.target.value)} placeholder="" />
                  <BlobInput label="Years in Business *" type="number" min="0" value={data.businessYears} onChange={(e: any) => onChange("businessYears", e.target.value)} placeholder="" />
                </div>
                {/* Business Logo upload */}
                <div>
                  <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block mb-2">Business Logo</span>
                  <label className="flex items-center gap-4 border border-dashed border-[#E6D9C8] hover:border-orange-400 bg-white/50 rounded-2xl p-4 cursor-pointer transition-all group">
                    <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 overflow-hidden shrink-0">
                      {data.businessLogo
                        ? <img src={data.businessLogo} alt="" className="w-full h-full object-cover" />
                        : <Upload className="w-5 h-5 text-[#EA580C]" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#2C1D12]">{data.businessLogo ? "Logo selected ✓" : "Upload Business Logo"}</div>
                      <div className="text-[11px] text-[#7A6455] font-semibold mt-0.5">PNG, JPG (square, max 2MB)</div>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setLogoFile(f);
                        onChange("businessLogo", URL.createObjectURL(f));
                      }
                    }} />
                  </label>
                </div>
                {/* Business Gallery Photos */}
                <div>
                  <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block mb-2">Business Photos (Gallery)</span>
                  <label className="flex flex-col items-center justify-center border border-dashed border-[#E6D9C8] hover:border-orange-400 bg-white/50 rounded-2xl p-6 cursor-pointer transition-all group">
                    <Upload className="w-6 h-6 text-[#EA580C] mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-sm font-bold text-[#2C1D12]">Select Business Photos</div>
                    <div className="text-[11px] text-[#7A6455] font-semibold mt-0.5">PNG, JPG (up to 10 photos, max 2MB each)</div>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryChange} />
                  </label>

                  {/* Selected Gallery Previews */}
                  {galleryPreviews.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-3">
                      {galleryPreviews.map((src, idx) => (
                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-[#E6D9C8] bg-orange-50 group">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeGalleryPhoto(idx)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Description */}
                <div className="bg-white/60 border border-[#E6D9C8] rounded-2xl p-3 px-4 focus-within:border-[#EA580C] focus-within:bg-white transition-all">
                  <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider block mb-1">Public Description</span>
                  <textarea rows={3} value={data.businessDesc} onChange={e => onChange("businessDesc", e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm text-[#2C1D12] font-bold resize-none focus:ring-0"
                    placeholder="Briefly describe your products & services..."
                  />
                </div>
              </div>
            )}

            {/* TAB: Contact & Location */}
            {bizTab === "contact" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <BlobInput label="Business Phone" type="tel" icon={Phone} value={data.businessPhone} onChange={(e: any) => onChange("businessPhone", e.target.value)} placeholder="" />
                <BlobInput label="WhatsApp Number" type="tel" icon={Phone} value={data.businessWhatsapp} onChange={(e: any) => onChange("businessWhatsapp", e.target.value)} placeholder="" />
                <BlobInput label="Business Email" type="email" icon={Mail} value={data.businessEmail} onChange={(e: any) => onChange("businessEmail", e.target.value)} placeholder="" />
                <BlobInput label="Website URL" type="url" icon={Globe} value={data.businessWebsite} onChange={(e: any) => onChange("businessWebsite", e.target.value)} placeholder="" />
                <div className="sm:col-span-2 bg-white/60 border border-[#E6D9C8] rounded-2xl p-3 px-4 focus-within:border-[#EA580C] focus-within:bg-white transition-all">
                  <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider block mb-1">Business Address</span>
                  <textarea rows={2} value={data.businessAddress} onChange={e => onChange("businessAddress", e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm text-[#2C1D12] font-bold resize-none focus:ring-0"
                    placeholder="Street, Area, Landmark..."
                  />
                </div>
                <BlobInput label="City" icon={MapPin} value={data.businessCity} onChange={(e: any) => onChange("businessCity", e.target.value)} placeholder="" />
                <BlobInput label="State" value={data.businessState} onChange={(e: any) => onChange("businessState", e.target.value)} placeholder="" />
                <BlobInput label="Pincode" type="number" value={data.businessPincode} onChange={(e: any) => onChange("businessPincode", e.target.value)} placeholder="" />
              </div>
            )}

            {/* TAB: Hours & Socials */}
            {bizTab === "hours" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Operating Hours
                  </span>
                  {DAYS.map(day => {
                    const val = data.businessHours?.[day] || "Closed";
                    const isClosed = val === "Closed";
                    const isAllDay = val === "Open 24 Hours";
                    return (
                      <div key={day} className="flex items-center gap-2 bg-white/60 border border-[#E6D9C8] rounded-xl px-3 py-2">
                        <span className="text-[11px] font-bold text-[#2C1D12] w-24 shrink-0">{day}</span>
                        <select value={isClosed ? "Closed" : isAllDay ? "Open 24 Hours" : "custom"}
                          onChange={e => {
                            if (e.target.value === "Closed") updateHours(day, "Closed");
                            else if (e.target.value === "Open 24 Hours") updateHours(day, "Open 24 Hours");
                            else updateHours(day, "09:00 AM - 07:00 PM");
                          }}
                          className="text-[11px] bg-orange-50 border border-orange-200 rounded-lg px-2 py-1 font-bold text-[#EA580C] focus:outline-none">
                          <option value="Closed">Closed</option>
                          <option value="Open 24 Hours">Open 24 Hours</option>
                          <option value="custom">Custom Hours</option>
                        </select>
                        {!isClosed && !isAllDay && (
                          <>
                            <select value={parseHour(val, "open")}
                              onChange={e => setHourPart(day, "open", e.target.value)}
                              className="text-[11px] bg-white border border-[#E6D9C8] rounded-lg px-2 py-1 font-semibold text-[#2C1D12] focus:outline-none flex-1">
                              <option value="">Open</option>
                              {TIME_OPTIONS.filter(t => t !== "Closed" && t !== "Open 24 Hours").map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-[11px] text-[#7A6455] font-bold">–</span>
                            <select value={parseHour(val, "close")}
                              onChange={e => setHourPart(day, "close", e.target.value)}
                              className="text-[11px] bg-white border border-[#E6D9C8] rounded-lg px-2 py-1 font-semibold text-[#2C1D12] focus:outline-none flex-1">
                              <option value="">Close</option>
                              {TIME_OPTIONS.filter(t => t !== "Closed" && t !== "Open 24 Hours").map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block">Social Media Links</span>
                  <BlobInput label="Instagram" icon={Instagram} value={data.businessInstagram} onChange={(e: any) => onChange("businessInstagram", e.target.value)} placeholder="" />
                  <BlobInput label="Facebook" icon={Facebook} value={data.businessFacebook} onChange={(e: any) => onChange("businessFacebook", e.target.value)} placeholder="" />
                  <BlobInput label="YouTube" icon={Youtube} value={data.businessYoutube} onChange={(e: any) => onChange("businessYoutube", e.target.value)} placeholder="" />
                  <BlobInput label="LinkedIn" icon={Linkedin} value={data.businessLinkedin} onChange={(e: any) => onChange("businessLinkedin", e.target.value)} placeholder="" />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Community({ data, onChange, communities }: { data: any; onChange: (key: string, val: any) => void; communities: any[] }) {
  const options = communities.map(c => ({
    value: c.id.toString(),
    label: c.path && Array.isArray(c.path) ? c.path.join(" → ") : (c.parent_name ? `${c.parent_name} → ${c.name}` : c.name)
  }));
  const handleCommunityChange = (id: string) => {
    const selected = communities.find(c => c.id.toString() === id);
    if (selected) {
      onChange("communityId", selected.id.toString());
      onChange("communityName", selected.name);
      onChange("cState", selected.state);
      onChange("cDistrict", selected.district);
      onChange("cTaluka", selected.taluka);
    }
  };
  const selectedCommunity = communities.find(c => c.id.toString() === data.communityId);
  const pathArr: string[] = selectedCommunity?.path && Array.isArray(selectedCommunity.path)
    ? selectedCommunity.path
    : selectedCommunity?.parent_name
      ? [selectedCommunity.parent_name, selectedCommunity.name]
      : [selectedCommunity?.name || data.communityName || ""];

  return (
    <div className="space-y-6">
      <BlobSelect label="Select Community" options={options.length > 0 ? options : [{ value: "1", label: "Rampara Ahir Samaj" }]} value={data.communityId || (communities[0]?.id.toString() || "1")} onChange={handleCommunityChange} />

      {/* Warning banner to guide community selection */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
        <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
        <span><strong>Important:</strong> Make sure you select the <strong>exact community</strong> you belong to. Selecting the wrong community will delay your approval.</span>
      </div>

      {/* Selected community card with hierarchy */}
      {selectedCommunity && (
        <div className="p-5 bg-orange-50/50 backdrop-blur-sm border border-orange-200 rounded-2xl shadow-sm">
          <div className="text-[10px] uppercase tracking-wider font-bold text-[#EA580C] mb-3">✅ Your Selected Community</div>

          {/* Hierarchy breadcrumb */}
          <div className="flex flex-wrap items-center gap-1 mb-3">
            {pathArr.map((node, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${i === pathArr.length - 1 ? "bg-[#EA580C] text-white border-[#EA580C]" : "bg-orange-100/70 text-[#EA580C] border-orange-200"}`}>
                  {node}
                </span>
                {i < pathArr.length - 1 && <span className="text-orange-300 font-bold">→</span>}
              </span>
            ))}
          </div>

          {/* Community details */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#7A6455]">
            {selectedCommunity.state && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#EA580C]">State:</span> {selectedCommunity.state}
              </div>
            )}
            {selectedCommunity.district && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#EA580C]">District:</span> {selectedCommunity.district}
              </div>
            )}
            {selectedCommunity.type && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#EA580C]">Type:</span> {selectedCommunity.type}
              </div>
            )}
            {selectedCommunity.plan && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#EA580C]">Plan:</span> {selectedCommunity.plan}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Verify({
  data, onChange, aadhaarFile, setAadhaarFile
}: {
  data: any; onChange: (key: string, val: any) => void;
  aadhaarFile: File | null;
  setAadhaarFile: (f: File | null) => void;
}) {
  return (
    <div className="space-y-6">
      <BlobInput label="Aadhaar Number" placeholder="" value={data.aadhaarNo} onChange={(e: any) => onChange("aadhaarNo", e.target.value)} />

      <div className="relative w-full pt-4">
        <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block mb-2">Aadhaar Card Copy</span>
        <label className="block border-2 border-dashed border-[#E6D9C8] hover:border-orange-400 bg-white/50 backdrop-blur-sm p-8 text-center cursor-pointer transition-all rounded-2xl group shadow-sm">
          <div className="w-12 h-12 rounded-full bg-orange-50 mx-auto flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
            <Upload className="w-5 h-5 text-[#EA580C]" />
          </div>
          <div className="text-sm font-bold text-[#2C1D12]">{data.aadhaarPhoto ? `Selected: ${data.aadhaarPhoto}` : "Upload Aadhaar Photo"}</div>
          <div className="text-[11px] font-semibold text-[#EA580C] uppercase tracking-wider mt-1">{data.aadhaarPhoto ? "Click to replace" : "PDF, JPG or PNG (max 5MB)"}</div>
          <input type="file" className="hidden" onChange={e => {
            const f = e.target.files?.[0];
            if (f) {
              setAadhaarFile(f);
              onChange("aadhaarPhoto", f.name);
            }
          }} />
        </label>
      </div>

      <label className="flex items-start gap-3 text-xs font-semibold text-[#7A6455] cursor-pointer ml-1 mt-6">
        <input type="checkbox" className="mt-0.5 accent-[#EA580C] w-4 h-4 rounded border-[#E6D9C8]" />
        <span>I confirm that all details provided are correct to the best of my knowledge and I accept the <span className="text-[#EA580C] font-bold hover:underline">Terms of Service</span>.</span>
      </label>
    </div>
  );
}

function Success({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="min-h-screen bg-[#FCF5EC] flex items-center justify-center px-6 font-sans">
      <div className="bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(238,150,80,0.12)] p-10 max-w-md w-full border border-orange-200/50 text-center relative rounded-[32px]">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 border-[6px] border-[#FCF5EC]">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}><CheckCircle2 className="w-12 h-12 text-white" /></motion.div>
        </motion.div>

        <h2 className="font-serif text-3xl font-bold text-[#2C1D12] mb-2 mt-8">Submitted!</h2>
        <p className="text-[#7A6455] mt-2 text-sm font-semibold">Your details have been sent to <strong className="text-[#EA580C] font-bold">{data.communityName || "your community"}</strong> for verification.</p>

        <div className="mt-8 text-left space-y-4 text-xs bg-orange-50/50 backdrop-blur-sm rounded-2xl p-6 border border-orange-100">
          <div className="font-bold text-[#EA580C] uppercase tracking-wide text-[11px]">Your Login Credentials</div>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-[#7A6455] text-[10px] font-bold uppercase tracking-wider">Email / Phone</span>
              <span className="bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-orange-200/50 font-bold text-[#2C1D12] text-sm shadow-sm">{data.email || data.mobile}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#7A6455] text-[10px] font-bold uppercase tracking-wider">Password</span>
              <span className="bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-orange-200/50 font-bold text-[#2C1D12] text-sm shadow-sm">{data.password || "User123!"}</span>
            </div>
          </div>
          <div className="text-[11px] text-[#7A6455]/80 leading-relaxed font-semibold mt-4 pt-4 border-t border-orange-100">
            Note: You can log in using these credentials once the community admin approves your request.
          </div>
        </div>

        <button onClick={onClose} className="relative w-full py-3.5 mt-8 rounded-full bg-gradient-to-r from-[#F25C05] to-[#FFA74D] hover:from-[#E14D02] hover:to-[#FF952B] hover:shadow-[0_12px_40px_rgba(242,92,5,0.45)] focus:outline-none text-white font-extrabold text-[15px] tracking-wide shadow-[0_8px_30px_rgba(242,92,5,0.3)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 group">
          Continue to login
        </button>
      </div>
    </div>
  );
}
