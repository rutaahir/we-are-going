import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Upload, User } from "lucide-react";
import { PageTransition, StepProgress } from "@/components/wag/primitives";
import { api } from "@/lib/api";
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/register/")({
  head: () => ({ meta: [{ title: "Register — We Are Going" }] }),
  component: Register,
});

const STEPS = ["Personal", "Location", "Education", "Profession", "Community", "Verify"];

function Register() {
  // Load draft states from sessionStorage if available
  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem("reg_member_step");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [communitiesList, setCommunitiesList] = useState<any[]>([]);
  const navigate = useNavigate();

  // Load existing communities from Django on mount
  useEffect(() => {
    api.getCommunities().then(res => {
      if (res && res.length > 0) {
        setCommunitiesList(res);
        // Sync draft with first available community if ID is not set
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Form State
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem("reg_member_draft");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      photo: "",
      fullName: "",
      dob: "",
      gender: "Male",
      mobile: "",
      email: "",
      password: "",
      country: "India",
      state: "Gujarat",
      district: "Amreli",
      taluka: "Rajula",
      village: "Rampara",
      address: "",
      school: "",
      college: "",
      degree: "",
      fieldOfStudy: "",
      passingYear: "",
      professionType: "Job",
      jobTitle: "",
      company: "",
      industry: "",
      salary: "",
      businessName: "",
      businessCategory: "",
      gstNo: "",
      businessYears: "",
      cState: "Gujarat",
      cDistrict: "Amreli",
      cTaluka: "Rajula",
      communityName: "Rampara Ahir Samaj",
      communityId: "",
      aadhaarNo: "",
      aadhaarPhoto: ""
    };
  });

  // Save changes to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("reg_member_draft", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem("reg_member_step", step.toString());
  }, [step]);

  // SPA Navigation vs Browser Reload handler
  useEffect(() => {
    let isUnloading = false;
    const handleUnload = () => {
      isUnloading = true;
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      // Clean up if navigating away within the app
      if (!isUnloading) {
        sessionStorage.removeItem("reg_member_draft");
        sessionStorage.removeItem("reg_member_step");
      }
    };
  }, []);

  const updateField = (key: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: val }));
  };

  const next = async () => { 
    if (step === 0) {
      if (!formData.fullName.trim()) {
        alert("Full Name is required.");
        return;
      }
      if (!formData.mobile.trim()) {
        alert("Mobile number is required.");
        return;
      }
      if (!formData.email.trim()) {
        alert("Email address is required.");
        return;
      }
      if (!formData.password.trim()) {
        alert("Please set a password for your account.");
        return;
      }
    }
    if (step < STEPS.length - 1) {
      setDir(1); 
      setStep(step + 1);
    } else {
      if (!formData.aadhaarNo || !formData.aadhaarNo.trim()) {
        alert("Aadhaar Number is mandatory to complete verification.");
        return;
      }
      const cleanAadhaar = formData.aadhaarNo.replace(/[^0-9]/g, "");
      if (cleanAadhaar.length !== 12) {
        alert("Aadhaar Number must be exactly 12 digits.");
        return;
      }
      if (!formData.aadhaarPhoto) {
        alert("Please upload your Aadhaar card photo.");
        return;
      }

      setIsSubmitting(true);
      try {
        // Calculate approximate age from DOB
        let age = 25;
        if (formData.dob) {
          const birthYear = new Date(formData.dob).getFullYear();
          age = new Date().getFullYear() - birthYear;
        }

        // Clean name to make a secure unique username
        const cleanName = formData.fullName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const username = `${cleanName || "user"}_${Math.floor(100 + Math.random() * 900)}`;

        const registrationPayload = {
          username: username,
          password: formData.password || "User123!",
          email: formData.email || `${username}@example.com`,
          name: formData.fullName,
          phone: formData.mobile,
          gender: formData.gender,
          age: age,
          state: formData.state,
          district: formData.district,
          taluka: formData.taluka,
          village: formData.village || "Rampara",
          profession: formData.professionType === "Job" ? formData.jobTitle : formData.businessName,
          education: formData.degree || "Graduate",
          // Detailed Education fields
          school: formData.school,
          college: formData.college,
          degree: formData.degree,
          fieldOfStudy: formData.fieldOfStudy,
          passingYear: formData.passingYear,
          // Detailed Profession fields
          professionType: formData.professionType,
          jobTitle: formData.jobTitle,
          company: formData.company,
          industry: formData.industry,
          salary: formData.salary,
          businessName: formData.businessName,
          businessCategory: formData.businessCategory,
          gstNo: formData.gstNo,
          businessYears: formData.businessYears,
          communityId: parseInt(formData.communityId, 10) || 1,
          role: "member",
          aadhaar: formData.aadhaarNo
        };

        // Call backend registration endpoint
        await api.register(registrationPayload);

        // Clean up sessionStorage
        sessionStorage.removeItem("reg_member_draft");
        sessionStorage.removeItem("reg_member_step");
        setDone(true);
      } catch (err) {
        console.error("Member registration failed: ", err);
        alert("Registration failed. Please make sure the email is unique and backend is running.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const back = () => { 
    setDir(-1); 
    setStep(s => Math.max(0, s - 1)); 
  };

  if (done) return <PageTransition><Success data={formData} onClose={() => navigate({ to: "/login" })} /></PageTransition>;
  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-4rem)] bg-sand py-10">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="font-display text-4xl font-semibold text-center mb-2">Become a member</h1>
          <p className="text-center text-warm-muted mb-8">A 6-step profile so your samaj can find and verify you.</p>
          <div className="bg-surface rounded-2xl shadow-warm p-6 lg:p-10 border border-warm">
            <StepProgress steps={STEPS} current={step} />
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={step} custom={dir}
                initial={{ x: dir > 0 ? 60 : -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: dir > 0 ? -60 : 60, opacity: 0 }}
                transition={{ duration: 0.3 }}>
                {step === 0 && <Personal data={formData} onChange={updateField} />}
                {step === 1 && <LocationStep data={formData} onChange={updateField} />}
                {step === 2 && <Education data={formData} onChange={updateField} />}
                {step === 3 && <Profession data={formData} onChange={updateField} />}
                {step === 4 && <Community data={formData} onChange={updateField} communities={communitiesList} />}
                {step === 5 && <Verify data={formData} onChange={updateField} />}
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-between mt-8 pt-6 border-t border-warm">
              <button onClick={back} disabled={step === 0 || isSubmitting} className="px-5 py-2.5 rounded-lg border border-warm text-sm font-medium disabled:opacity-30 flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
              <button onClick={next} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-1 shadow-sapphire disabled:opacity-50">
                {isSubmitting ? "Submitting..." : step === STEPS.length - 1 ? "Submit Application" : "Next"} 
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

const Input = ({ label, ...p }: any) => (
  <div>
    <label className="text-sm font-medium block mb-1.5">{label}</label>
    <input className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" {...p} />
  </div>
);

type SelectOption = string | { value: string; label: string };

const Select = ({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  options: SelectOption[]; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string 
}) => {
  const triggerClass = "w-full px-3 py-2.5 h-[46px] rounded-lg border border-warm bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm cursor-pointer flex items-center justify-between";

  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <RadixSelect value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder={placeholder || `Select ${label}`} />
        </SelectTrigger>
        <SelectContent className="max-h-[250px] overflow-y-auto bg-surface border border-warm rounded-lg shadow-lg">
          {options.map((o) => {
            const val = typeof o === "string" ? o : o.value;
            const lbl = typeof o === "string" ? o : o.label;
            return (
              <SelectItem key={val} value={val}>
                {lbl}
              </SelectItem>
            );
          })}
        </SelectContent>
      </RadixSelect>
    </div>
  );
};

const DateOfBirthInput = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [year, month, day] = value ? value.split("-") : ["", "", ""];

  const handleDayChange = (d: string) => {
    const newDay = d.padStart(2, "0");
    const newMonth = month ? month.padStart(2, "0") : "01";
    const newYear = year || new Date().getFullYear().toString();
    onChange(`${newYear}-${newMonth}-${newDay}`);
  };

  const handleMonthChange = (m: string) => {
    const newDay = day ? day.padStart(2, "0") : "01";
    const newMonth = m.padStart(2, "0");
    const newYear = year || new Date().getFullYear().toString();
    onChange(`${newYear}-${newMonth}-${newDay}`);
  };

  const handleYearChange = (y: string) => {
    const newDay = day ? day.padStart(2, "0") : "01";
    const newMonth = month ? month.padStart(2, "0") : "01";
    const newYear = y;
    onChange(`${newYear}-${newMonth}-${newDay}`);
  };

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  const triggerClass = "w-full px-3 py-2.5 h-[46px] rounded-lg border border-warm bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm cursor-pointer flex items-center justify-between";

  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">Date of Birth</label>
      <div className="grid grid-cols-3 gap-2">
        <RadixSelect
          value={day ? String(parseInt(day, 10)) : undefined}
          onValueChange={handleDayChange}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto bg-surface border border-warm rounded-lg shadow-lg">
            {days.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </RadixSelect>

        <RadixSelect
          value={month ? String(parseInt(month, 10)) : undefined}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto bg-surface border border-warm rounded-lg shadow-lg">
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </RadixSelect>

        <RadixSelect
          value={year || undefined}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto bg-surface border border-warm rounded-lg shadow-lg">
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </RadixSelect>
      </div>
    </div>
  );
};

function Personal({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5">
        <label className="cursor-pointer">
          <div className="w-24 h-24 rounded-full bg-sand border-2 border-dashed border-warm flex items-center justify-center overflow-hidden">
            {data.photo ? <img src={data.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-warm-muted" />}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onChange("photo", URL.createObjectURL(f)); }} />
        </label>
        <div><h3 className="font-ui font-semibold">Profile photo</h3><p className="text-xs text-warm-muted">JPG, PNG. Max 5MB.</p></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Full Name" placeholder="Rohit Patel" value={data.fullName} onChange={(e: any) => onChange("fullName", e.target.value)} />
        <DateOfBirthInput value={data.dob} onChange={(val: string) => onChange("dob", val)} />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1.5">Gender</label>
        <div className="flex gap-2">
          {["Male", "Female", "Other"].map(g => (
            <button key={g} type="button" onClick={() => onChange("gender", g)} className={`px-4 py-2 rounded-full border text-sm transition ${data.gender === g ? "bg-primary border-primary text-white" : "border-warm text-foreground hover:border-primary"}`}>{g}</button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Mobile" placeholder="+91 98XXX XXXXX" value={data.mobile} onChange={(e: any) => onChange("mobile", e.target.value)} />
        <Input label="Email" type="email" placeholder="you@email.com" value={data.email} onChange={(e: any) => onChange("email", e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Password" type="password" placeholder="Create a secure password" value={data.password || ""} onChange={(e: any) => onChange("password", e.target.value)} />
      </div>
    </div>
  );
}

const DISTRICTS_OF_STATE: Record<string, string[]> = {
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Arunachal Pradesh": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey", "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley", "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup Metropolitan", "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Dima Hasao", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran (Motihari)", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur (Bhabua)", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger (Monghyr)", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia (Purnea)", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
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
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Burdwan (Bardhaman)", "Cooch Behar", "Dakshin Dinajpur (South Dinajpur)", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Medinipur (West Medinipur)", "Purba Medinipur (East Medinipur)", "Purulia", "South 24 Parganas", "Uttar Dinajpur (North Dinajpur)"]
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
  
  const districts = DISTRICTS_OF_STATE[data.state] || [
    `${data.state} District 1`, 
    `${data.state} District 2`
  ];
  
  const talukas = TALUKAS_OF_DISTRICT[data.district] || [
    `${data.district} Taluka 1`, 
    `${data.district} Taluka 2`
  ];
  
  const villages = data.taluka ? (VILLAGES_OF_TALUKA[data.taluka] || [
    `${data.taluka} Village 1`, 
    `${data.taluka} Village 2`
  ]) : [];

  const handleCountryChange = (val: string) => {
    onChange("country", val);
    const firstState = LOCATION_DATA[val]?.[0] || "";
    handleStateChangeInternal(val, firstState);
  };

  const handleStateChangeInternal = (countryVal: string, stateVal: string) => {
    onChange("state", stateVal);
    const stateDistricts = DISTRICTS_OF_STATE[stateVal] || [`${stateVal} District 1`];
    const firstDistrict = stateDistricts[0] || "";
    handleDistrictChangeInternal(countryVal, stateVal, firstDistrict);
  };

  const handleStateChange = (val: string) => {
    handleStateChangeInternal(data.country, val);
  };

  const handleDistrictChangeInternal = (countryVal: string, stateVal: string, districtVal: string) => {
    onChange("district", districtVal);
    const distTalukas = TALUKAS_OF_DISTRICT[districtVal] || [`${districtVal} Taluka 1`];
    const firstTaluka = distTalukas[0] || "";
    handleTalukaChangeInternal(firstTaluka);
  };

  const handleDistrictChange = (val: string) => {
    handleDistrictChangeInternal(data.country, data.state, val);
  };

  const handleTalukaChangeInternal = (talukaVal: string) => {
    if (talukaVal === "Other (Type Custom)") {
      setShowCustomTaluka(true);
      onChange("taluka", "");
      onChange("village", "");
    } else {
      setShowCustomTaluka(false);
      onChange("taluka", talukaVal);
      const talukaVillages = VILLAGES_OF_TALUKA[talukaVal] || [`${talukaVal} Village 1`];
      onChange("village", talukaVillages[0] || "");
    }
  };

  const handleTalukaChange = (val: string) => {
    handleTalukaChangeInternal(val);
  };

  const handleVillageChange = (val: string) => {
    if (val === "Other (Type Custom)") {
      setShowCustomVillage(true);
      onChange("village", "");
    } else {
      setShowCustomVillage(false);
      onChange("village", val);
    }
  };

  const talukaOptions = [...talukas, "Other (Type Custom)"];
  const villageOptions = [...villages, "Other (Type Custom)"];

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Select label="Country" options={Object.keys(LOCATION_DATA)} value={data.country} onChange={handleCountryChange} />
        <Select label="State" options={states} value={data.state} onChange={handleStateChange} />
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <Select label="District" options={districts} value={data.district} onChange={handleDistrictChange} />
        
        {showCustomTaluka ? (
          <div>
            <Input label="Taluka (Custom)" placeholder="Enter taluka name" value={data.taluka} onChange={(e: any) => onChange("taluka", e.target.value)} />
            <button type="button" onClick={() => handleTalukaChangeInternal(talukas[0] || "")} className="text-xs text-primary hover:underline mt-1">
              ← Select from pre-defined list
            </button>
          </div>
        ) : (
          <Select label="Taluka" options={talukaOptions} value={data.taluka} onChange={handleTalukaChange} />
        )}
      </div>

      {showCustomVillage ? (
        <div>
          <Input label="Village (Custom)" placeholder="Enter village name" value={data.village} onChange={(e: any) => onChange("village", e.target.value)} />
          <button type="button" onClick={() => handleVillageChange(villages[0] || "")} className="text-xs text-primary hover:underline mt-1">
            ← Select from pre-defined list
          </button>
        </div>
      ) : (
        <Select label="Village" options={villageOptions} value={data.village} onChange={handleVillageChange} />
      )}

      <div>
        <label className="text-sm font-medium block mb-1.5">Address</label>
        <textarea rows={3} className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="House no, street, area…" value={data.address} onChange={(e: any) => onChange("address", e.target.value)} />
      </div>
    </div>
  );
}

function Education({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Input label="School" value={data.school} onChange={(e: any) => onChange("school", e.target.value)} />
      <Input label="College" value={data.college} onChange={(e: any) => onChange("college", e.target.value)} />
      <Input label="Degree" value={data.degree} onChange={(e: any) => onChange("degree", e.target.value)} />
      <Input label="Field of Study" value={data.fieldOfStudy} onChange={(e: any) => onChange("fieldOfStudy", e.target.value)} />
      <Input label="Passing Year" type="number" value={data.passingYear} onChange={(e: any) => onChange("passingYear", e.target.value)} />
    </div>
  );
}

function Profession({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="inline-flex bg-sand rounded-full p-1">
        {(["Job", "Business"] as const).map(x => (
          <button key={x} type="button" onClick={() => onChange("professionType", x)} className={`px-6 py-2 rounded-full text-sm transition ${data.professionType === x ? "bg-primary text-white" : "text-warm-muted"}`}>{x}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={data.professionType} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid sm:grid-cols-2 gap-4">
          {data.professionType === "Job" ? (
            <>
              <Input label="Job Title" value={data.jobTitle} onChange={(e: any) => onChange("jobTitle", e.target.value)} />
              <Input label="Company" value={data.company} onChange={(e: any) => onChange("company", e.target.value)} />
              <Input label="Industry" value={data.industry} onChange={(e: any) => onChange("industry", e.target.value)} />
              <Input label="Annual Salary (LPA)" type="number" value={data.salary} onChange={(e: any) => onChange("salary", e.target.value)} />
            </>
          ) : (
            <>
              <Input label="Business Name" value={data.businessName} onChange={(e: any) => onChange("businessName", e.target.value)} />
              <Input label="Category" value={data.businessCategory} onChange={(e: any) => onChange("businessCategory", e.target.value)} />
              <Input label="GST No." value={data.gstNo} onChange={(e: any) => onChange("gstNo", e.target.value)} />
              <Input label="Years in Business" type="number" value={data.businessYears} onChange={(e: any) => onChange("businessYears", e.target.value)} />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Community({ data, onChange, communities }: { data: any; onChange: (key: string, val: any) => void; communities: any[] }) {
  const options = communities.map(c => {
    const label = c.parent_name ? `${c.parent_name} → ${c.name}` : c.name;
    return {
      value: c.id.toString(),
      label: label
    };
  });
  
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
  const displayFlow = selectedCommunity
    ? (selectedCommunity.parent_name 
        ? `${selectedCommunity.parent_name} → ${selectedCommunity.name}` 
        : selectedCommunity.name)
    : data.communityName;

  return (
    <div className="space-y-4">
      <Select 
        label="Community" 
        options={options.length > 0 ? options : [{ value: "1", label: "Rampara Ahir Samaj" }]} 
        value={data.communityId || (communities[0]?.id.toString() || "1")} 
        onChange={handleCommunityChange} 
      />
      <div className="p-4 rounded-xl bg-gold-light border border-amber-200 text-sm">
        <span className="font-semibold text-gold">Selected:</span> {displayFlow}
      </div>
    </div>
  );
}

function Verify({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) {
  return (
    <div className="space-y-4">
      <Input label="Aadhaar Number" placeholder="XXXX-XXXX-XXXX" value={data.aadhaarNo} onChange={(e: any) => onChange("aadhaarNo", e.target.value)} />
      <label className="block border-2 border-dashed border-warm rounded-xl p-8 text-center cursor-pointer hover:border-primary">
        <Upload className="w-8 h-8 mx-auto text-warm-muted" />
        <div className="mt-2 text-sm font-medium">{data.aadhaarPhoto ? `Selected: ${data.aadhaarPhoto}` : "Upload Aadhaar photo"}</div>
        <div className="text-xs text-warm-muted">{data.aadhaarPhoto ? "Click to change" : "PDF or image, max 5MB"}</div>
        <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onChange("aadhaarPhoto", f.name); }} />
      </label>
      <label className="flex items-start gap-2 text-sm text-warm-muted"><input type="checkbox" className="mt-1" /> I accept the Terms of Service and Privacy Policy.</label>
    </div>
  );
}

function Success({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-sand flex items-center justify-center px-6">
      <div className="bg-surface rounded-2xl shadow-warm-lg p-10 max-w-lg w-full border border-warm text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-20 h-20 mx-auto rounded-full bg-teal/15 flex items-center justify-center mb-5">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}><CheckCircle2 className="w-12 h-12 text-teal" /></motion.div>
        </motion.div>
        <h2 className="font-display text-3xl font-semibold">Application Submitted</h2>
        <p className="text-warm-muted mt-2">Your details have been sent to {data.communityName || "your community"} for verification.</p>
        
        <div className="mt-5 text-left space-y-3 text-sm bg-sand rounded-xl p-5 border border-warm">
          <div className="font-semibold text-primary">Your Login Credentials:</div>
          <div className="space-y-1.5 font-mono text-xs">
            <div>
              <span className="font-sans font-medium text-warm-muted">Email/Phone:</span> <span className="bg-surface px-2 py-0.5 rounded border border-warm font-semibold text-foreground">{data.email || data.mobile}</span>
            </div>
            <div>
              <span className="font-sans font-medium text-warm-muted">Password:</span> <span className="bg-surface px-2 py-0.5 rounded border border-warm font-semibold text-foreground">{data.password || "User123!"}</span>
            </div>
          </div>
          <div className="text-[11px] text-warm-muted font-sans leading-relaxed italic">
            Note: You can log in using these credentials once the community admin reviews and approves your membership request.
          </div>
        </div>

        <div className="mt-6 text-left space-y-2 text-sm bg-sand rounded-xl p-4">
          {[{l: "Submitted", d: "Just now", ok: true}, {l: "Document review", d: "1-2 working days", ok: false}, {l: "Community admin approval", d: "2-5 working days", ok: false}, {l: "Welcome email", d: "After approval", ok: false}].map(s => (
            <div key={s.l} className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full ${s.ok ? "bg-teal text-white" : "bg-warm"} flex items-center justify-center text-[10px]`}>{s.ok ? "✓" : ""}</div><div className="flex-1"><div className="font-medium">{s.l}</div><div className="text-xs text-warm-muted">{s.d}</div></div></div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl bg-primary text-white font-medium">Continue to login</button>
      </div>
    </div>
  );
}
