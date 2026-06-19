import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, MapPin, Users, IndianRupee, Calendar as CalendarIcon, Clock,
  CheckSquare, Search, Heart, Info, ArrowLeft, ArrowRight, CheckCircle2,
  AlertTriangle, DollarSign, FileText, ClipboardCheck, ArrowUpRight,
  QrCode, Star, Tag, X, Sparkles, LogIn, ShieldAlert, Sparkle,
  SlidersHorizontal, ChevronRight, ChevronDown, Check, Trash2, CalendarDays,
  User, Bell
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/venues")({
  component: MemberPropertyBooking,
});

type DashboardView = 'browse' | 'bookings' | 'waiting' | 'payments' | 'invoices' | 'saved';

function MemberPropertyBooking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<DashboardView>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Data States
  const [properties, setProperties] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [pricings, setPricings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestCount, setGuestCount] = useState<number>(100);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState("recommended");

  // Saved Venues list
  const [savedPropertyIds, setSavedPropertyIds] = useState<number[]>([]);

  // Detailed Property state (Screens 3 and 4)
  const [detailedProperty, setDetailedProperty] = useState<any>(null);
  const [activeTabInDetails, setActiveTabInDetails] = useState<string>('about');

  // Bookings filter subtab state (Screen 9)
  const [bookingsSubTab, setBookingsSubTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  // Booking Flow/Wizard state
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState<number>(1); // 1: Choose Resources & Date, 2: Choose Add-ons, 3: Review & Pay, 4: Confirmation
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("Online Payment");
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>("");

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    start_date: "", end_date: "", start_time: "09:00", end_time: "17:00",
    event_name: "", event_type: "Wedding", purpose: "", expected_guests: 100,
    guest_name: user?.name || "", guest_phone: "", guest_email: user?.email || ""
  });

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{
    available: boolean;
    status: 'available' | 'partial' | 'unavailable';
    details: any[];
    suggestions: any[];
    pricing?: any;
  } | null>(null);

  // Post-booking view state
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState("");

  const [hierarchicalCommunities, setHierarchicalCommunities] = useState<any[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");

  const fetchData = async (commId?: string) => {
    try {
      const targetCommId = commId !== undefined ? commId : selectedCommunityId;
      const [propsRes, resRes, priceRes, booksRes, waitRes] = await Promise.all([
        api.getBookingProperties(targetCommId),
        api.getPropertyResources(),
        api.getResourcePricing(),
        api.getVenueBookings(),
        api.getBookingWaitingList()
      ]);
      const approvedProperties = (propsRes || []).filter((property: any) => property.status === "Approved");
      setProperties(approvedProperties);
      setFilteredProperties(approvedProperties);
      setResources(resRes || []);
      setPricings(priceRes || []);
      setBookings(booksRes || []);
      setWaitingList(waitRes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load venues dataset.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Load saved properties
    const saved = localStorage.getItem("wag_saved_venues");
    if (saved) {
      try {
        setSavedPropertyIds(JSON.parse(saved));
      } catch (e) {}
    }

    // Load hierarchical communities
    if (user?.communityId) {
      api.getCommunities().then(allComms => {
        const userCommId = Number(user.communityId);
        const hierarchy: any[] = [];
        
        let current = allComms.find((c: any) => Number(c.id) === userCommId);
        if (current) {
          hierarchy.push(current);
          let parentId = current.parent;
          while (parentId) {
            const parentObj = allComms.find((c: any) => Number(c.id) === Number(parentId));
            if (parentObj && !hierarchy.some(h => h.id === parentObj.id)) {
              hierarchy.push({ ...parentObj, relation: 'Parent' });
              parentId = parentObj.parent;
            } else {
              break;
            }
          }
        }
        
        const addDescendants = (commId: number) => {
          const children = allComms.filter((c: any) => Number(c.parent) === commId);
          children.forEach((child: any) => {
            if (!hierarchy.some(h => h.id === child.id)) {
              hierarchy.push({ ...child, relation: 'Subdivision/Subsidiary' });
              addDescendants(Number(child.id));
            }
          });
        };
        addDescendants(userCommId);
        
        setHierarchicalCommunities(hierarchy);
      }).catch(e => {
        console.warn("Failed to load hierarchical communities", e);
      });
    }
  }, [user]);

  // Sync guest pre-fill when user context updates
  useEffect(() => {
    if (user) {
      setBookingForm(prev => ({
        ...prev,
        guest_name: user.name,
        guest_email: user.email
      }));
    }
  }, [user]);

  // Handle Search and Filter logic
  const handleSearch = () => {
    let result = [...properties];

    // Filter by name or city/state
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(query) ||
             p.city.toLowerCase().includes(query) ||
             p.state.toLowerCase().includes(query) ||
             p.address.toLowerCase().includes(query)
      );
    }

    // Filter by guests capacity
    if (guestCount > 0) {
      result = result.filter(p => {
        return getPropertyCapacity(p.id) >= guestCount;
      });
    }

    setFilteredProperties(result);
    toast.success(`Found ${result.length} matching venues!`);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setCheckInDate("");
    setCheckOutDate("");
    setGuestCount(100);
    setFilteredProperties(properties);
    toast.success("Filters reset.");
  };

  // Toggle Save property
  const toggleSaveProperty = (id: number) => {
    let updated = [...savedPropertyIds];
    if (updated.includes(id)) {
      updated = updated.filter(x => x !== id);
      toast.success("Venue removed from saved list.");
    } else {
      updated.push(id);
      toast.success("Venue added to saved list!");
    }
    setSavedPropertyIds(updated);
    localStorage.setItem("wag_saved_venues", JSON.stringify(updated));
  };

  // Parse custom descriptions seeded
  const parsePropertyDesc = (desc: string) => {
    const parts = desc?.split("||") || [];
    let rating = 4.5;
    let capacity = 500;
    let cleanDesc = desc || "";

    parts.forEach(part => {
      if (part.startsWith("RATING:")) {
        rating = parseFloat(part.replace("RATING:", ""));
      } else if (part.startsWith("CAPACITY:")) {
        capacity = parseInt(part.replace("CAPACITY:", ""));
      } else if (part.includes("||")) {
        // Skip metadata tags
      } else {
        cleanDesc = part;
      }
    });

    return { rating, capacity, description: cleanDesc };
  };

  const getPropertyResources = (propertyId: number) => {
    return resources.filter(r => r.property === propertyId && r.status === "Active");
  };

  const getPropertyCapacity = (propertyId: number) => {
    const propResources = getPropertyResources(propertyId);
    return propResources.reduce((max, res) => Math.max(max, Number(res.capacity || 0)), 0);
  };

  const getPropertyStartingPrice = (property: any) => {
    if (property.starting_price) return Number(property.starting_price);
    const propResources = getPropertyResources(property.id);
    const rates = propResources.flatMap(res => [
      Number(res.hourly_rate || 0),
      Number(res.half_day_rate || 0),
      Number(res.full_day_rate || 0),
      getResourcePrice(res.id)
    ]).filter(rate => rate > 0);
    return rates.length ? Math.min(...rates) : Number(property.security_deposit || 0);
  };

  const getPropertyImage = (property: any, size = 800) => {
    if (property.cover_image) return property.cover_image;
    if (Array.isArray(property.photos) && property.photos.length > 0) return property.photos[0];
    if (Array.isArray(property.gallery_images) && property.gallery_images.length > 0) return property.gallery_images[0];
    return `https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=${size}&q=80`;
  };

  // Get resource base prices dynamically
  const getResourcePrice = (resId: number) => {
    const memberType = user?.role === 'super_admin' || user?.role === 'community_admin'
      ? 'Committee'
      : (user?.role === 'member' ? 'Verified Member' : 'Non Member');

    const config = pricings.find(p => p.resource === resId && p.member_type === memberType);
    if (config) return parseFloat(config.price);

    const fallbackConfig = pricings.find(p => p.resource === resId);
    return fallbackConfig ? parseFloat(fallbackConfig.price) : 2000;
  };

  const ADDONS_LIST = [
    { id: "Sound System", label: "Sound System", price: 2000, description: "Professional sound system with microphones" },
    { id: "Stage", label: "Stage", price: 3000, description: "Elevated stage platform setup" },
    { id: "Extra Chairs (50)", label: "Extra Chairs (50)", price: 1000, description: "50 additional seating chairs" },
    { id: "Decoration Service", label: "Decoration Service", price: 5000, description: "Basic venue drapes and floral decoration" },
    { id: "Catering Service", label: "Catering Service", price: 10000, description: "Designated catering layout space and helpers" }
  ];

  // Stepper calculations
  const calculatePricing = () => {
    const addonsTotal = selectedAddons.reduce((sum, id) => sum + (ADDONS_LIST.find(a => a.id === id)?.price || 0), 0);
    if (availabilityResult && availabilityResult.pricing) {
      const p = availabilityResult.pricing;
      return {
        baseAmount: p.subtotal,
        additionalResources: 0,
        addonsTotal,
        tax: p.tax,
        deposit: p.deposit,
        grandTotal: p.grand_total + addonsTotal
      };
    }

    if (selectedResourceIds.length === 0) {
      const deposit = Number(selectedProperty?.security_deposit || 0);
      return { baseAmount: 0, additionalResources: 0, addonsTotal, tax: 0, deposit, grandTotal: deposit + addonsTotal };
    }

    const baseAmount = getResourcePrice(selectedResourceIds[0]);
    const additionalResources = selectedResourceIds.slice(1).reduce((sum, id) => sum + getResourcePrice(id), 0);
    const resourceTotal = baseAmount + additionalResources;
    const tax = resourceTotal * 0.18;
    const resourceDeposit = selectedResourceIds.reduce((sum, id) => {
      const resource = resources.find(res => res.id === id);
      return sum + Number(resource?.security_deposit || 0);
    }, 0);
    const deposit = resourceDeposit || Number(selectedProperty?.security_deposit || 0);
    const grandTotal = resourceTotal + tax + deposit + addonsTotal;

    return { baseAmount, additionalResources, addonsTotal, tax, deposit, grandTotal };
  };

  const getBookingDurationHours = () => {
    if (!bookingForm.start_date) return 0;
    const startStr = `${bookingForm.start_date}T${bookingForm.start_time || "09:00"}`;
    const endStr = `${bookingForm.end_date || bookingForm.start_date}T${bookingForm.end_time || "17:00"}`;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end.getTime() - start.getTime();
    if (isNaN(diffMs) || diffMs <= 0) return 0;
    return diffMs / (1000 * 60 * 60);
  };

  const getBookingDurationDays = (start_date?: string, end_date?: string) => {
    const sDate = start_date || bookingForm.start_date;
    const eDate = end_date || bookingForm.end_date || sDate;
    if (!sDate) return 1;
    const start = new Date(sDate);
    const end = new Date(eDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 1 : diffDays;
  };

  const getCategoryFilteredProperties = (sourceProps?: any[]) => {
    const propsList = sourceProps || filteredProperties;
    if (selectedCategory === "All") return propsList;
    return propsList.filter(p => {
      const type = (p.property_type || "").toLowerCase();
      if (selectedCategory === "Hall") {
        return type.includes("hall") || type.includes("center") || type.includes("clubhouse");
      }
      if (selectedCategory === "Guest House") {
        return type.includes("guest") || type.includes("dharamshala") || type.includes("room");
      }
      if (selectedCategory === "Garden") {
        return type.includes("garden");
      }
      if (selectedCategory === "Parking") {
        return type.includes("parking");
      }
      return true;
    });
  };

  const checkBackendAvailability = async (resIds?: number[]) => {
    const ids = resIds || selectedResourceIds;
    if (!selectedProperty || ids.length === 0 || !bookingForm.start_date) return;
    setCheckingAvailability(true);
    try {
      const res = await api.checkPropertyAvailability(selectedProperty.id, {
        start_date: bookingForm.start_date,
        end_date: bookingForm.end_date || bookingForm.start_date,
        start_time: bookingForm.start_time || "00:00",
        end_time: bookingForm.end_time || "23:59",
        resource_ids: ids,
      });
      setAvailabilityResult(res);
      if (!res.available) {
        toast.warning("The selected slot is fully or partially booked. Alternative suggestions are available.");
      } else {
        toast.success("All selected resources are available for this slot!");
      }
      return res;
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to check slot availability.");
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Check availability status based on booking dates
  const checkAvailability = () => {
    if (availabilityResult) {
      return availabilityResult.available;
    }
    if (!bookingForm.start_date) return true;
    const conflict = bookings.find(b =>
      b.property === selectedProperty?.id &&
      b.start_date === bookingForm.start_date &&
      b.status !== 'Cancelled' &&
      b.status !== 'Rejected'
    );
    return !conflict;
  };

  // Submit Booking / Join Waiting list
  const submitBookingRequest = async () => {
    const isAvailable = checkAvailability();

    if (!isAvailable) {
      // Create Waiting List entry
      try {
        const res = await api.createBookingWaitingList({
          property: selectedProperty.id,
          resource: selectedResourceIds[0] || null,
          start_date: bookingForm.start_date || null,
          end_date: bookingForm.end_date || null,
        });
        toast.success("Successfully joined the Waiting List! We will notify you if this slot becomes available.");
        setConfirmedBookingId(res?.id ? `WAG-WL-${res.id}` : `WAG-WL-${Math.floor(10000 + Math.random() * 90000)}`);
        setBookingStep(5);
        fetchData();
      } catch (error) {
        console.error("Error joining waiting list:", error);
        toast.error("Failed to join waiting list.");
      }
      return;
    }

    // Normal booking path
    try {
      const pricing = calculatePricing();
      const formData = new FormData();
      
      formData.append("property", selectedProperty.id.toString());
      selectedResourceIds.forEach(id => {
        formData.append("resources", id.toString());
      });
      
      formData.append("start_date", bookingForm.start_date);
      formData.append("end_date", bookingForm.end_date || bookingForm.start_date);
      formData.append("start_time", bookingForm.start_time || "09:00");
      formData.append("end_time", bookingForm.end_time || "17:00");
      formData.append("event_name", bookingForm.event_name);
      formData.append("event_type", bookingForm.event_type);
      formData.append("purpose", bookingForm.event_name || bookingForm.event_type);
      formData.append("expected_guests", bookingForm.expected_guests.toString());
      formData.append("guest_name", bookingForm.guest_name);
      formData.append("guest_phone", bookingForm.guest_phone);
      formData.append("guest_email", bookingForm.guest_email);

      let mappedMethod = "UPI";
      if (paymentMethod === "Manual Payment") {
        mappedMethod = "Cash";
      } else if (paymentMethod === "Bank Transfer") {
        mappedMethod = "Bank Transfer";
      }
      formData.append("payment_method", mappedMethod);

      if (transactionId) {
        formData.append("payment_reference", transactionId);
      }
      if (paymentScreenshot) {
        formData.append("payment_screenshot", paymentScreenshot);
      }

      const res = await api.createVenueBooking(formData);
      toast.success("Booking request submitted successfully!");
      setConfirmedBookingId(res?.booking_number || res?.booking_id || `WAG-B-2026-${Math.floor(10000 + Math.random() * 90000)}`);
      setBookingStep(5);
      fetchData();
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error("Failed to submit booking request.");
    }
  };

  // Payment upload
  const handlePaymentSubmit = async () => {
    if (!transactionId) {
      toast.error("Please enter your Transaction ID / UTR Number");
      return;
    }
    try {
      await api.updateVenueBooking(selectedBookingForDetails.id, {
        payment_status: 'Payment Submitted',
        status: 'Payment Submitted',
        payment_reference: transactionId
      });
      toast.success("Payment details submitted successfully! Awaiting verification.");
      setSelectedBookingForDetails(null);
      setTransactionId("");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit payment details.");
    }
  };

  // Helper date conversions
  const formatDateLong = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDayName = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
  };

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Stats Card Calculations
  const myBookingsCount = bookings.length;
  const savedCount = savedPropertyIds.length;
  const totalSpent = bookings
    .filter(b => ['Confirmed', 'Paid', 'Completed', 'Checked In'].includes(b.status))
    .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

  if (loading) return <div className="p-8 text-center text-warm-muted animate-pulse font-sans">Loading Property Venues...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-12 font-sans">
      {/* If we are NOT in property details and NOT in the booking wizard, show the header banner, stats cards, quick actions and nav tabs */}
      {/* If we are NOT in property details and NOT in the booking wizard, show the header banner, stats cards, quick actions if on dashboard */}
      {!detailedProperty && !selectedProperty && (
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => {
                navigate({ to: '/dashboard' });
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark cursor-pointer transition-colors w-fit"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>
            
            {/* The horizontal navigation sub-tabs bar */}
            <div className="flex gap-2 p-1.5 bg-sand/20 rounded-2xl overflow-x-auto scrollbar-none border border-border/40 w-fit">
              {[
                { id: 'browse', label: 'Browse Properties', icon: Building2 },
                { id: 'bookings', label: 'My Bookings', icon: CalendarIcon },
                { id: 'waiting', label: 'Waiting List', icon: ClipboardCheck },
                { id: 'payments', label: 'Payments', icon: DollarSign },
                { id: 'invoices', label: 'Invoices', icon: FileText },
                { id: 'saved', label: 'Saved Properties', icon: Heart }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveView(tab.id as DashboardView);
                    setDetailedProperty(null);
                    setSelectedProperty(null);
                    setSelectedBookingForDetails(null);
                    setBookingStep(1);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    activeView === tab.id
                      ? 'bg-card text-primary shadow-warm border border-border/60'
                      : 'text-warm-muted hover:text-foreground hover:bg-card/45'
                  }`}
                >
                  <tab.icon className="h-4.5 w-4.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
        {/* ======================================================== */}
        {/* 1. BOOKING WIZARD VIEW (Screens 5, 6, 7, 8)               */}
        {/* ======================================================== */}
        {selectedProperty && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header / Stepper Progress */}
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-warm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Venue Booking Builder</h2>
                  <p className="text-xs text-warm-muted">Step by step event space reservation for {selectedProperty.name}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProperty(null);
                    setBookingStep(1);
                  }}
                  className="self-start md:self-auto rounded-xl flex items-center gap-1 text-xs border-border/70"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Cancel & Exit
                </Button>
              </div>

              {/* Stepper bar */}
              {bookingStep < 5 && (
                <div className="relative flex justify-between items-center max-w-2xl mx-auto px-4 py-2">
                  <div className="absolute left-10 right-10 top-[26px] h-0.5 bg-border/40 z-0" />
                  {[1, 2, 3, 4].map(step => {
                    const stepLabels = ["Select Resources", "Date & Time", "Add-ons", "Review & Pay"];
                    const isCompleted = step < bookingStep;
                    const isActive = step === bookingStep;

                    return (
                      <div key={step} className="flex flex-col items-center gap-2 z-10 relative">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
                          isCompleted ? 'bg-primary border-primary text-white shadow-sm' :
                          isActive ? 'bg-card border-primary text-primary font-bold shadow-warm scale-105' :
                          'bg-card border-border/70 text-warm-muted'
                        }`}>
                          {isCompleted ? <Check className="h-5 w-5 stroke-[3]" /> : step}
                        </div>
                        <span className={`text-xs font-semibold tracking-tight whitespace-nowrap ${
                          isActive ? 'text-primary font-bold' : 'text-warm-muted'
                        }`}>
                          {stepLabels[step - 1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Main content pane (left side) */}
              <div className={`${bookingStep === 5 ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
                
                {/* STEP 1: Select Resources */}
                {bookingStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border/60 p-6 rounded-3xl shadow-warm">
                    
                    {/* Left pane: Available Resources */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-foreground">Available Resources</h3>
                        <p className="text-xs text-warm-muted">Select the rooms or spaces you wish to book</p>
                      </div>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {getPropertyResources(selectedProperty.id).map(res => {
                          const isSelected = selectedResourceIds.includes(res.id);
                          return (
                            <div 
                              key={res.id} 
                              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 shadow-sm' 
                                  : 'border-border/60 hover:bg-sand/5 bg-card'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setSelectedResourceIds(selectedResourceIds.filter(id => id !== res.id));
                                    } else {
                                      setSelectedResourceIds([...selectedResourceIds, res.id]);
                                    }
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-sm text-foreground block">{res.name}</span>
                                  <span className="text-[10px] text-warm-muted block uppercase font-medium">{res.resource_type}</span>
                                  <span className="text-[11px] text-warm-muted block">Capacity: {res.capacity} people</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-sm text-foreground block">{formatCurrency(res.pricing_details?.price_per_day || res.price_per_day || 0)}</span>
                                <span className="text-[9px] text-warm-muted block">/ Day</span>
                                <Badge className="mt-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-1.5 py-0">Available</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right pane: Selection Summary */}
                    <div className="space-y-4 border-l border-border/20 pl-0 md:pl-6">
                      <div>
                        <h3 className="text-base font-bold text-foreground">Selected Spaces</h3>
                        <p className="text-xs text-warm-muted">View resources selected for this reservation</p>
                      </div>

                      <div className="border border-border/50 rounded-2xl p-4 bg-sand/5 space-y-3">
                        <span className="text-xs font-bold text-foreground block border-b border-border/30 pb-1.5">Selected Items ({selectedResourceIds.length})</span>
                        {selectedResourceIds.length === 0 ? (
                          <span className="text-xs text-warm-muted italic block py-2">No resources selected yet. Click from the left checklist to choose.</span>
                        ) : (
                          <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                            {selectedResourceIds.map(id => {
                              const res = resources.find(r => r.id === id);
                              return (
                                <div key={id} className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-foreground truncate max-w-[165px]">{res?.name}</span>
                                  <span className="text-warm-muted font-bold">{formatCurrency(res?.pricing_details?.price_per_day || res?.price_per_day || 0)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Date & Time Selection */}
                {bookingStep === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border/60 p-6 rounded-3xl shadow-warm">
                    
                    {/* Left Pane: Interactive Calendar Grid */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-foreground">Select Date</h3>
                        <p className="text-xs text-warm-muted">Choose calendar dates for your booking</p>
                      </div>

                      <div className="border border-border/50 rounded-2xl p-4 bg-sand/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-foreground">May 2025</span>
                          <div className="flex gap-1">
                            <button className="h-6 w-6 rounded border flex items-center justify-center text-xs text-warm-muted hover:bg-card">&lt;</button>
                            <button className="h-6 w-6 rounded border flex items-center justify-center text-xs text-warm-muted hover:bg-card">&gt;</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-warm-muted">
                          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                          {Array.from({ length: 31 }).map((_, idx) => {
                            const day = idx + 1;
                            const isSelect = day === 20 || day === 21;
                            return (
                              <button 
                                key={idx} 
                                onClick={() => {
                                  const dateStr = `2025-05-${day < 10 ? '0' + day : day}`;
                                  if (!bookingForm.start_date) {
                                    setBookingForm(prev => ({ ...prev, start_date: dateStr }));
                                  } else {
                                    setBookingForm(prev => ({ ...prev, end_date: dateStr }));
                                  }
                                }}
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold transition-all ${
                                  isSelect 
                                    ? 'bg-primary text-white shadow-sm font-bold scale-105' 
                                    : 'hover:bg-primary/10 text-foreground'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Pane: Date Inputs */}
                    <div className="space-y-4 border-l border-border/20 pl-0 md:pl-6">
                      <div>
                        <h3 className="text-base font-bold text-foreground">Date & Time Settings</h3>
                        <p className="text-xs text-warm-muted">Enter schedule for check-in and check-out</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-warm-muted">Start Date</Label>
                          <Input 
                            type="date" 
                            value={bookingForm.start_date}
                            onChange={e => setBookingForm(prev => ({ ...prev, start_date: e.target.value }))}
                            className="rounded-xl h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-warm-muted">Start Time</Label>
                          <Input 
                            type="time" 
                            value={bookingForm.start_time}
                            onChange={e => setBookingForm(prev => ({ ...prev, start_time: e.target.value }))}
                            className="rounded-xl h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-warm-muted">End Date</Label>
                          <Input 
                            type="date" 
                            value={bookingForm.end_date}
                            onChange={e => setBookingForm(prev => ({ ...prev, end_date: e.target.value }))}
                            className="rounded-xl h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-warm-muted">End Time</Label>
                          <Input 
                            type="time" 
                            value={bookingForm.end_time}
                            onChange={e => setBookingForm(prev => ({ ...prev, end_time: e.target.value }))}
                            className="rounded-xl h-9 text-xs" 
                          />
                        </div>
                      </div>

                      <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl flex justify-between items-center text-xs font-semibold text-primary">
                        <span>Duration:</span>
                        <span>{getBookingDurationDays()} Day(s)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Optional Add-ons */}
                {bookingStep === 3 && (
                  <div className="bg-card border border-border/60 p-6 rounded-3xl shadow-warm space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground">Add-on Services (Optional)</h3>
                      <p className="text-xs text-warm-muted">Customize your booking with extra facilities offered by the community</p>
                    </div>

                    <div className="space-y-3 max-w-xl">
                      {ADDONS_LIST.map(addon => {
                        const isSelected = selectedAddons.includes(addon.id);
                        return (
                          <div 
                            key={addon.id}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-sm' 
                                : 'border-border/60 hover:bg-sand/5 bg-card'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setSelectedAddons(selectedAddons.filter(id => id !== addon.id));
                                  } else {
                                    setSelectedAddons([...selectedAddons, addon.id]);
                                  }
                                }}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                              />
                              <div>
                                <span className="font-bold text-sm text-foreground block">{addon.label}</span>
                                <span className="text-xs text-warm-muted block">{addon.description}</span>
                              </div>
                            </div>
                            <span className="font-bold text-sm text-foreground">{formatCurrency(addon.price)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 4: Review & Pay */}
                {bookingStep === 4 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border/60 p-6 rounded-3xl shadow-warm">
                    
                    {/* Left Column: Summary & Price Ledger */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-foreground">Booking Summary</h3>
                        <div className="rounded-2xl border border-border/50 bg-sand/5 p-4 space-y-3 text-xs">
                          <div className="flex justify-between border-b border-border/30 pb-2">
                            <span className="text-warm-muted font-medium">Property:</span>
                            <span className="font-bold text-foreground">{selectedProperty.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/30 pb-2">
                            <span className="text-warm-muted font-medium">Resources:</span>
                            <span className="font-bold text-foreground">
                              {selectedResourceIds.map(id => resources.find(r => r.id === id)?.name).join(", ") || "None"}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-border/30 pb-2">
                            <span className="text-warm-muted font-medium">Add-ons:</span>
                            <span className="font-bold text-foreground">
                              {selectedAddons.map(id => ADDONS_LIST.find(a => a.id === id)?.label).join(", ") || "None"}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-border/30 pb-2">
                            <span className="text-warm-muted font-medium">Date & Time:</span>
                            <span className="font-bold text-foreground text-right">{bookingForm.start_date} to {bookingForm.end_date || bookingForm.start_date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-warm-muted font-medium">Duration:</span>
                            <span className="font-bold text-foreground">{getBookingDurationDays()} Day(s)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-base font-bold text-foreground">Price Details</h3>
                        <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-2.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-warm-muted">Subtotal</span>
                            <span className="font-bold text-foreground">{formatCurrency(calculatePricing().baseAmount + calculatePricing().additionalResources)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-warm-muted">Add-ons</span>
                            <span className="font-bold text-foreground">{formatCurrency(calculatePricing().addonsTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-warm-muted">Taxes (18%)</span>
                            <span className="font-bold text-foreground">{formatCurrency(calculatePricing().tax)}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/30 pb-2">
                            <span className="text-warm-muted">Security Deposit</span>
                            <span className="font-bold text-foreground">{formatCurrency(calculatePricing().deposit)}</span>
                          </div>
                          <div className="flex justify-between text-base font-extrabold text-primary pt-1">
                            <span>Total Amount</span>
                            <span>{formatCurrency(calculatePricing().grandTotal)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px] text-warm-muted font-medium">
                        <p className="font-bold text-foreground text-xs uppercase tracking-wider">Policies</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Cancellation allowed up to 48 hours before booking.</li>
                          <li>Refund 75% if cancelled within cancellation period.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Right Column: Payment Method */}
                    <div className="space-y-6 border-l border-border/20 pl-0 md:pl-6">
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-foreground">Payment Method</h3>
                        <div className="space-y-3">
                          {[
                            { id: "Online Payment", title: "Online Payment", desc: "Pay securely using UPI, Cards, Net Banking" },
                            { id: "Manual Cash", title: "Manual Payment", desc: "Pay at property (approval required)" },
                            { id: "Partial Payment", title: "Partial Payment", desc: "Pay now and remaining later" }
                          ].map(method => (
                            <label 
                              key={method.id} 
                              className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                                paymentMethod === method.id 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-border/60 hover:bg-sand/5 bg-card'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="payment_method"
                                checked={paymentMethod === method.id}
                                onChange={() => setPaymentMethod(method.id)}
                                className="mt-1 text-primary focus:ring-primary cursor-pointer"
                              />
                              <div>
                                <span className="font-bold text-sm text-foreground block">{method.title}</span>
                                <span className="text-xs text-warm-muted block">{method.desc}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Payment inputs */}
                      <div className="space-y-3 border-t border-border/30 pt-4">
                        <p className="text-[10px] font-bold text-warm-muted uppercase tracking-wider">Submit Payment Proof</p>
                        <div className="bg-sand/5 p-4 rounded-xl border space-y-2 text-xs text-warm-muted">
                          <p><strong>UPI ID:</strong> community@upi</p>
                          <p><strong>Bank Details:</strong> we Are United Samaj | A/C: 1234567890 | IFSC: SBIN000123</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Transaction Reference ID (UTR)</Label>
                          <Input 
                            value={transactionId}
                            onChange={e => setTransactionId(e.target.value)}
                            placeholder="Enter 12-digit UTR Code" 
                            className="rounded-xl h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Upload Receipt Screenshot</Label>
                          <Input 
                            type="file"
                            onChange={e => setPaymentScreenshot(e.target.files?.[0] || null)}
                            className="rounded-xl text-xs" 
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* STEP 5: Booking Confirmation Screen */}
                {bookingStep === 5 && (
                  <div className="max-w-md mx-auto bg-card border border-border/60 p-8 rounded-3xl shadow-warm text-center space-y-6">
                    <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Check className="h-10 w-10 stroke-[3]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground">Booking Confirmed!</h3>
                      <p className="text-xs text-warm-muted">Your booking has been confirmed successfully.</p>
                    </div>

                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 inline-block font-mono text-sm font-bold text-primary">
                      Booking ID: {confirmedBookingId || "BK-2025-00123"}
                    </div>

                    <div className="flex gap-3 justify-center pt-2">
                      <Button 
                        onClick={() => {
                          setSelectedProperty(null);
                          setDetailedProperty(null);
                          setActiveView('bookings');
                          setSelectedBookingForDetails(null);
                          setBookingStep(1);
                        }}
                        className="bg-primary hover:bg-primary-dark text-white rounded-xl h-10 px-5 font-semibold text-xs transition-all shadow-warm"
                      >
                        View My Bookings
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          toast.success("Receipt downloaded successfully!");
                        }}
                        className="border-border/70 rounded-xl h-10 px-4 font-semibold text-xs flex items-center gap-1.5"
                      >
                        <FileText className="h-4 w-4 text-primary" /> Download Receipt
                      </Button>
                    </div>
                  </div>
                )}

              </div>

              {/* Wizard Sidebar Summary (only shown in Steps 1-4) */}
              {bookingStep < 5 && (
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                  <Card className="border border-border/80 rounded-2xl shadow-warm bg-card overflow-hidden">
                    <CardHeader className="p-4 border-b border-border/40 bg-sand/10">
                      <CardTitle className="text-base font-bold text-foreground">Booking Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex gap-3 items-center border-b border-border/30 pb-3">
                        <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-sand/20">
                          <img 
                            src={getPropertyImage(selectedProperty, 200)} 
                            alt={selectedProperty.name} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-foreground truncate">{selectedProperty.name}</h4>
                          <p className="text-[10px] text-warm-muted truncate">{selectedProperty.city}, {selectedProperty.state}</p>
                        </div>
                      </div>

                      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex justify-between items-center shadow-sm">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Total Amount</span>
                          <div className="text-xl font-extrabold text-primary leading-tight">
                            {formatCurrency(calculatePricing().grandTotal)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-warm-muted block">Resources</span>
                          <span className="text-xs font-bold text-foreground block">
                            {selectedResourceIds.length} Selected
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Event Name</Label>
                        <Input 
                          value={bookingForm.event_name}
                          onChange={e => setBookingForm(prev => ({ ...prev, event_name: e.target.value }))}
                          placeholder="e.g. Wedding Reception"
                          className="rounded-xl h-9 text-xs"
                        />
                      </div>

                      {/* Next/Continue buttons with Back button matching reference layout */}
                      <div className="flex gap-2 mt-2">
                        {bookingStep > 1 && (
                          <Button
                            variant="outline"
                            onClick={() => setBookingStep(bookingStep - 1)}
                            className="flex-1 border-border/70 rounded-xl h-10 font-bold text-xs"
                          >
                            Back
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            if (bookingStep === 1) {
                              if (!bookingForm.event_name) {
                                toast.error("Please enter your Event Name.");
                                return;
                              }
                              if (selectedResourceIds.length === 0) {
                                toast.error("Please select at least 1 resource.");
                                return;
                              }
                              setBookingStep(2);
                            } else if (bookingStep === 2) {
                              if (!bookingForm.start_date) {
                                toast.error("Please select a date.");
                                return;
                              }
                              const durationHours = getBookingDurationHours();
                              const selectedResourcesList = resources.filter((r: any) => selectedResourceIds.includes(r.id));
                              for (const res of selectedResourcesList) {
                                const minH = Number(res.min_booking_duration_hours || 1);
                                const maxH = Number(res.max_booking_duration_hours || 720);
                                if (durationHours < minH) {
                                  toast.error(`${res.name} requires a minimum booking duration of ${minH} hour(s). Selected duration is ${durationHours.toFixed(1)} hours.`);
                                  return;
                                }
                                if (durationHours > maxH) {
                                  toast.error(`${res.name} allows a maximum booking duration of ${maxH} hour(s). Selected duration is ${durationHours.toFixed(1)} hours.`);
                                  return;
                                }
                              }
                              setBookingStep(3);
                            } else if (bookingStep === 3) {
                              setBookingStep(4);
                            } else if (bookingStep === 4) {
                              submitBookingRequest();
                            }
                          }}
                          className={`${bookingStep > 1 ? 'flex-[2]' : 'w-full'} bg-primary hover:bg-primary-dark text-white rounded-xl h-10 font-bold transition-all shadow-warm flex items-center justify-center gap-1.5`}
                        >
                          <span>
                            {bookingStep === 4 ? "Proceed to Book" : "Continue"}
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. PROPERTY DETAILS VIEW (Screens 3 and 4)               */}
        {/* ======================================================== */}
        {detailedProperty && !selectedProperty && (
          <div className="space-y-6 max-w-6xl mx-auto font-sans">
            {/* Breadcrumb Back Link */}
            <div 
              onClick={() => setDetailedProperty(null)}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark cursor-pointer transition-colors w-fit"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Browse Properties
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Gallery & Information Tabs */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Image Gallery */}
                <div className="space-y-3">
                  <div className="h-[400px] w-full rounded-3xl overflow-hidden bg-sand/20 border shadow-sm">
                    <img 
                      src={getPropertyImage(detailedProperty, 800)} 
                      alt={detailedProperty.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Thumbnails row */}
                  <div className="grid grid-cols-5 gap-3">
                    {Array.isArray(detailedProperty.photos) && detailedProperty.photos.slice(0, 5).map((photo: string, idx: number) => (
                      <div key={idx} className="h-16 rounded-xl overflow-hidden bg-sand/20 border cursor-pointer hover:border-primary transition-all">
                        <img src={photo} alt="thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabs bar */}
                <div className="flex gap-1.5 p-1 bg-sand/10 rounded-2xl overflow-x-auto scrollbar-none border border-border/40">
                  {[
                    { id: 'about', label: 'About' },
                    { id: 'amenities', label: 'Amenities' },
                    { id: 'policies', label: 'Policies' },
                    { id: 'resources', label: `Resources (${getPropertyResources(detailedProperty.id).length})` },
                    { id: 'gallery', label: 'Gallery' },
                    { id: 'location', label: 'Location' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabInDetails(tab.id)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTabInDetails === tab.id
                          ? 'bg-card text-primary shadow-sm border border-border/50'
                          : 'text-warm-muted hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content panel */}
                <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-warm min-h-[200px]">
                  {activeTabInDetails === 'about' && (
                    <div className="space-y-4">
                      <p className="text-sm text-foreground leading-relaxed font-medium">
                        {detailedProperty.description || "A spacious and beautiful community hall with modern amenities suitable for all types of events and family functions."}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                        {detailedProperty.amenities?.map((am: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-warm-muted">
                            <Sparkle className="h-4 w-4 text-primary shrink-0" />
                            <span>{am}</span>
                          </div>
                        )) || (
                          <>
                            <div className="flex items-center gap-2 text-xs font-semibold text-warm-muted"><Sparkle className="h-4 w-4 text-primary" /> AC</div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-warm-muted"><Sparkle className="h-4 w-4 text-primary" /> WiFi</div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-warm-muted"><Sparkle className="h-4 w-4 text-primary" /> Parking</div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-warm-muted"><Sparkle className="h-4 w-4 text-primary" /> CCTV</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTabInDetails === 'amenities' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {(detailedProperty.amenities || ["AC", "WiFi", "Parking", "CCTV", "Power Backup", "Lift", "Catering Space"]).map((am: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-sand/10 border border-border/40 rounded-xl font-bold text-xs text-foreground">
                          <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                          <span>{am}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTabInDetails === 'policies' && (
                    <div className="space-y-4 text-xs font-medium text-warm-muted leading-relaxed">
                      <div>
                        <h4 className="font-bold text-foreground text-sm mb-1.5 uppercase tracking-wider">Cancellation Policy</h4>
                        <p>Cancellation allowed up to {detailedProperty.cancellation_hours || 48} hours before the booking starts for a refund.</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm mb-1.5 uppercase tracking-wider">Refund Policy</h4>
                        <p>Refund of up to {detailedProperty.refund_percentage || 75}% will be disbursed upon cancellation within the period.</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm mb-1.5 uppercase tracking-wider">Security Deposit</h4>
                        <p>A refundable security deposit of {formatCurrency(detailedProperty.security_deposit || 2000)} is mandatory to cover any damage or utility cleanups.</p>
                      </div>
                    </div>
                  )}

                  {activeTabInDetails === 'resources' && (
                    <div className="space-y-4">
                      <div className="border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-sand/20 font-bold text-warm-muted uppercase text-[9px] tracking-wider border-b border-border/40">
                            <tr>
                              <th className="px-4 py-2.5">Resource Area</th>
                              <th className="px-4 py-2.5">Type</th>
                              <th className="px-4 py-2.5">Rate / Day</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 font-medium">
                            {getPropertyResources(detailedProperty.id).map(res => (
                              <tr key={res.id} className="hover:bg-sand/5">
                                <td className="px-4 py-3 font-bold text-foreground">{res.name}</td>
                                <td className="px-4 py-3 text-warm-muted uppercase text-[10px]">{res.resource_type}</td>
                                <td className="px-4 py-3 font-bold text-foreground">{formatCurrency(res.pricing_details?.price_per_day || res.price_per_day || 0)}</td>
                                <td className="px-4 py-3">
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">Available</Badge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      setSelectedProperty(detailedProperty);
                                      setSelectedResourceIds([res.id]);
                                      setBookingStep(1);
                                    }}
                                    className="rounded-lg h-7 px-3 text-[10px] border-primary text-primary hover:bg-primary/5 font-bold"
                                  >
                                    View
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTabInDetails === 'gallery' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {(detailedProperty.photos || []).map((img: string, idx: number) => (
                        <div key={idx} className="aspect-video rounded-xl overflow-hidden bg-sand/20 border">
                          <img src={img} alt="gallery" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTabInDetails === 'location' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-bold">
                        <MapPin className="h-4.5 w-4.5 text-primary shrink-0" />
                        <span>{detailedProperty.address}, {detailedProperty.city}, {detailedProperty.state} - {detailedProperty.pincode}</span>
                      </div>
                      <div className="h-60 w-full rounded-2xl bg-sand/10 border flex items-center justify-center text-xs text-warm-muted font-bold relative overflow-hidden shadow-inner">
                        <div className="absolute inset-0 opacity-45 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
                        <span>[ Interactive Google Maps Placement Area ]</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Floating Stats & Actions (Screen 3 right side) */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                <Card className="border border-border/80 rounded-3xl shadow-warm bg-card overflow-hidden">
                  <CardHeader className="p-6 pb-4 border-b border-border/40 bg-sand/10">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="font-extrabold text-xl text-foreground line-clamp-1">{detailedProperty.name}</h3>
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px] shrink-0">Available</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Information Table */}
                    <div className="space-y-3 text-xs">
                      {[
                        { label: "Property Type", value: detailedProperty.property_type },
                        { label: "Starting Price", value: `${formatCurrency(getPropertyStartingPrice(detailedProperty))} / Day` },
                        { label: "Resources Available", value: `${getPropertyResources(detailedProperty.id).length}` },
                        { label: "Max Capacity", value: `${getPropertyCapacity(detailedProperty.id) || 500} People` },
                        { label: "Address", value: `${detailedProperty.address}, ${detailedProperty.city}` },
                        { label: "Contact Person", value: `${detailedProperty.contact_person_name || 'RameshBhai Patel'}` },
                        { label: "Contact Phone", value: `${detailedProperty.contact_phone || '98765 43210'}` }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start border-b border-border/30 pb-2">
                          <span className="text-warm-muted font-medium shrink-0 w-28">{item.label}</span>
                          <span className="font-bold text-foreground text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button variant="outline" className="rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border-border/70">
                        Share Property
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => toggleSaveProperty(detailedProperty.id)}
                        className="rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border-border/70"
                      >
                        <Heart className={`h-4.5 w-4.5 ${savedPropertyIds.includes(detailedProperty.id) ? 'fill-red-500 text-red-500' : 'text-warm-muted'}`} /> 
                        Favorite
                      </Button>
                    </div>

                    <Button 
                      onClick={() => {
                        setSelectedProperty(detailedProperty);
                        const propRes = getPropertyResources(detailedProperty.id);
                        if (propRes[0]) {
                          setSelectedResourceIds([propRes[0].id]);
                        }
                        setBookingStep(1);
                      }}
                      className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl h-12 font-bold text-sm transition-all shadow-warm flex items-center justify-center gap-2"
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. NORMAL TABS (Browse, Saved, Bookings, Waiting Lists)    */}
        {/* ======================================================== */}
        {!selectedProperty && !detailedProperty && (
          <div className="space-y-6">
            


            {/* BROWSE VENUES TAB */}
            {activeView === 'browse' && (
              <div className="space-y-6">
                {/* Category filter tabs */}
                <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none">
                  {['All', 'Hall', 'Guest House', 'Garden', 'Parking'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                        selectedCategory === cat
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-card text-warm-muted border-border/60 hover:bg-sand/5 hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search & Filters block (Screen 2) */}
                <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-warm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Search Venue</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search by property name..."
                          className="pl-3 pr-10 py-2 w-full bg-background border-border/70 rounded-xl focus:ring-primary focus:border-primary text-sm h-10"
                        />
                        <Search className="absolute right-3 top-3 h-4.5 w-4.5 text-warm-muted" />
                      </div>
                    </div>

                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Community Hierarchy</Label>
                      <select
                        value={selectedCommunityId}
                        onChange={e => {
                          const cid = e.target.value;
                          setSelectedCommunityId(cid);
                          fetchData(cid);
                        }}
                        className="flex h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                      >
                        <option value="">All Allowed Communities</option>
                        {hierarchicalCommunities.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.relation ? `(${c.relation})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Check-In</Label>
                      <Input
                        type="date"
                        value={checkInDate}
                        onChange={e => setCheckInDate(e.target.value)}
                        className="py-2 w-full bg-background border-border/70 rounded-xl text-sm h-10"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Check-Out</Label>
                      <Input
                        type="date"
                        value={checkOutDate}
                        onChange={e => setCheckOutDate(e.target.value)}
                        className="py-2 w-full bg-background border-border/70 rounded-xl text-sm h-10"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Guests</Label>
                      <select
                        value={guestCount}
                        onChange={e => setGuestCount(parseInt(e.target.value))}
                        className="flex h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                      >
                        <option value={50}>50 Guests</option>
                        <option value={100}>100 Guests</option>
                        <option value={200}>200 Guests</option>
                        <option value={300}>300 Guests</option>
                        <option value={500}>500 Guests</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border/30">
                    <Button
                      onClick={handleSearch}
                      className="bg-primary hover:bg-primary-dark text-white rounded-xl h-10 px-6 font-semibold transition-all shadow-warm"
                    >
                      Search Venues
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleResetFilters();
                        setSelectedCommunityId("");
                        fetchData("");
                      }}
                      className="border-primary text-primary hover:bg-primary/5 rounded-xl h-10 px-4 flex items-center gap-1.5"
                    >
                      <SlidersHorizontal className="h-4.5 w-4.5" /> Reset
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Popular Venues</h2>
                    <p className="text-xs text-warm-muted">Explore our handpicked community venues for your special days</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-warm-muted font-medium whitespace-nowrap">Sort by:</span>
                    <select
                      value={sortOption}
                      onChange={e => {
                        setSortOption(e.target.value);
                        if (e.target.value === "price_low") {
                          setFilteredProperties([...filteredProperties].sort((a,b) => getPropertyStartingPrice(a) - getPropertyStartingPrice(b)));
                        } else if (e.target.value === "price_high") {
                          setFilteredProperties([...filteredProperties].sort((a,b) => getPropertyStartingPrice(b) - getPropertyStartingPrice(a)));
                        } else {
                          setFilteredProperties(properties);
                        }
                      }}
                      className="text-xs font-semibold bg-transparent border-none focus:outline-none text-foreground cursor-pointer"
                    >
                      <option value="recommended">Recommended</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {getCategoryFilteredProperties().map(property => {
                    const propRes = getPropertyResources(property.id);
                    const specs = parsePropertyDesc(property.description);
                    const isSaved = savedPropertyIds.includes(property.id);
                    const imageUrl = getPropertyImage(property);

                    return (
                      <Card 
                        key={property.id} 
                        className="overflow-hidden bg-card border border-border/60 hover:shadow-warm-lg transition-all duration-300 rounded-2xl flex flex-col group cursor-pointer"
                        onClick={() => {
                          setDetailedProperty(property);
                          setActiveTabInDetails('about');
                        }}
                      >
                        <div className="h-48 relative overflow-hidden shrink-0 bg-sand/20">
                          <img
                            src={imageUrl}
                            alt={property.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute bottom-3 left-3 bg-white/95 text-primary border border-primary/10 backdrop-blur px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                            <Star className="h-3 w-3 fill-primary stroke-primary" /> {specs.rating.toFixed(1)}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveProperty(property.id);
                            }}
                            className="absolute top-3 right-3 h-8.5 w-8.5 rounded-full bg-white/95 hover:bg-white text-warm-muted hover:text-red-500 flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                          >
                            <Heart className={`h-4.5 w-4.5 ${isSaved ? 'text-red-500 fill-red-500' : 'text-warm-muted'}`} />
                          </button>
                          <Badge className="absolute top-3 left-3 bg-primary/90 hover:bg-primary text-white border-none font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                            {property.property_type}
                          </Badge>
                        </div>

                        <CardHeader className="p-4 pb-2 space-y-1 flex-1">
                          <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">{property.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-warm-muted">
                            <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                            <span className="truncate">{property.address}, {property.city}</span>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-0 pb-4 space-y-3 shrink-0">
                          <div className="flex items-center gap-4 border-t border-b border-border/40 py-2.5 text-xs text-warm-muted font-medium">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-warm-muted/80" />
                              <span>Up to {getPropertyCapacity(property.id) || specs.capacity} guests</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-4 w-4 text-warm-muted/80" />
                              <span>{propRes.length} areas</span>
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="p-4 pt-0 bg-transparent flex items-center justify-between gap-3 shrink-0">
                          <div>
                            <span className="text-lg font-bold text-foreground">{formatCurrency(getPropertyStartingPrice(property))}</span>
                            <span className="text-[10px] text-warm-muted font-medium"> starting</span>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProperty(property);
                              setBookingStep(1);
                              if (propRes[0]) {
                                setSelectedResourceIds([propRes[0].id]);
                              }
                            }}
                            className="bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold px-4 h-9 shadow-warm transition-all"
                          >
                            Book Now
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SAVED VENUES TAB */}
            {activeView === 'saved' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Saved Venues</h2>
                  <p className="text-xs text-warm-muted">Properties you bookmarked for reference</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.filter(p => savedPropertyIds.includes(p.id)).length === 0 ? (
                    <div className="col-span-full py-16 bg-card border border-dashed rounded-3xl text-center space-y-3">
                      <Heart className="h-12 w-12 text-warm-muted/50 mx-auto" />
                      <h3 className="font-bold text-foreground">No Saved Venues</h3>
                      <p className="text-xs text-warm-muted">Bookmark properties using the heart icon to see them here.</p>
                      <Button variant="outline" size="sm" onClick={() => setActiveView('browse')} className="rounded-xl">Browse Properties</Button>
                    </div>
                  ) : (
                    properties.filter(p => savedPropertyIds.includes(p.id)).map(property => {
                      const propRes = getPropertyResources(property.id);
                      const specs = parsePropertyDesc(property.description);
                      const imageUrl = getPropertyImage(property);

                      return (
                        <Card 
                          key={property.id} 
                          className="overflow-hidden bg-card border border-border/60 hover:shadow-warm-lg transition-all rounded-2xl flex flex-col group cursor-pointer"
                          onClick={() => {
                            setDetailedProperty(property);
                            setActiveTabInDetails('about');
                          }}
                        >
                          <div className="h-48 relative overflow-hidden shrink-0">
                            <img
                              src={imageUrl}
                              alt={property.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute bottom-3 left-3 bg-white/95 text-primary border border-primary/10 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                              <Star className="h-3 w-3 fill-primary stroke-primary" /> {specs.rating.toFixed(1)}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveProperty(property.id);
                              }}
                              className="absolute top-3 right-3 h-8.5 w-8.5 rounded-full bg-white/95 text-red-500 flex items-center justify-center shadow-sm"
                            >
                              <Heart className="h-4.5 w-4.5 fill-red-500 text-red-500" />
                            </button>
                            <Badge className="absolute top-3 left-3 bg-primary/90 text-white border-none font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                              {property.property_type}
                            </Badge>
                          </div>

                          <CardHeader className="p-4 pb-2 space-y-1 flex-1">
                            <h3 className="font-bold text-lg text-foreground line-clamp-1">{property.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-warm-muted">
                              <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                              <span className="truncate">{property.address}, {property.city}</span>
                            </div>
                          </CardHeader>

                          <CardFooter className="p-4 pt-0 bg-transparent flex items-center justify-between gap-3 shrink-0">
                            <div>
                              <span className="text-lg font-bold text-foreground">{formatCurrency(getPropertyStartingPrice(property))}</span>
                              <span className="text-[10px] text-warm-muted font-medium"> starting</span>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProperty(property);
                                setBookingStep(1);
                                if (propRes[0]) {
                                  setSelectedResourceIds([propRes[0].id]);
                                }
                              }}
                              className="bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold px-4 h-9 shadow-warm transition-all"
                            >
                              Book Now
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* MY BOOKINGS TAB (Screen 9) */}
            {activeView === 'bookings' && (
              <div className="space-y-6">
                {!selectedBookingForDetails ? (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">My Bookings</h2>
                        <p className="text-xs text-warm-muted">Track reservation status and download receipts</p>
                      </div>
                    </div>

                    {/* Booking Category Tabs (Screen 9 tabs) */}
                    <div className="flex gap-2 p-1 bg-sand/10 border border-border/40 rounded-2xl w-fit">
                      {[
                        { id: 'upcoming', label: 'Upcoming' },
                        { id: 'completed', label: 'Completed' },
                        { id: 'cancelled', label: 'Cancelled' }
                      ].map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => setBookingsSubTab(sub.id as any)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            bookingsSubTab === sub.id
                              ? 'bg-card text-primary shadow-sm border border-border/50'
                              : 'text-warm-muted hover:text-foreground'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4 max-w-4xl">
                      {bookings.filter(b => {
                        if (bookingsSubTab === 'upcoming') {
                          return ['Draft', 'Pending Approval', 'Pending Payment', 'Confirmed', 'Checked In'].includes(b.status);
                        } else if (bookingsSubTab === 'completed') {
                          return ['Completed', 'Checked Out'].includes(b.status);
                        } else {
                          return ['Cancelled', 'Rejected', 'Refunded'].includes(b.status);
                        }
                      }).length === 0 ? (
                        <div className="py-16 bg-card border border-dashed border-border/60 rounded-3xl text-center space-y-3">
                          <CalendarIcon className="h-12 w-12 text-warm-muted/40 mx-auto" />
                          <h3 className="font-bold text-foreground">No Bookings in this Category</h3>
                          <p className="text-xs text-warm-muted">You have no {bookingsSubTab} booking reservations.</p>
                          <Button variant="outline" size="sm" onClick={() => setActiveView('browse')} className="rounded-xl">Book a Venue</Button>
                        </div>
                      ) : (
                        bookings.filter(b => {
                          if (bookingsSubTab === 'upcoming') {
                            return ['Draft', 'Pending Approval', 'Pending Payment', 'Confirmed', 'Checked In'].includes(b.status);
                          } else if (bookingsSubTab === 'completed') {
                            return ['Completed', 'Checked Out'].includes(b.status);
                          } else {
                            return ['Cancelled', 'Rejected', 'Refunded'].includes(b.status);
                          }
                        }).map(booking => {
                          const prop = properties.find(p => p.id === booking.property);
                          const statusColors: Record<string, string> = {
                            'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
                            'Pending Payment': 'bg-blue-50 text-blue-700 border-blue-200',
                            'Confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            'Completed': 'bg-gray-100 text-gray-700 border-gray-200',
                            'Cancelled': 'bg-red-50 text-red-700 border-red-200',
                          };

                          return (
                            <Card key={booking.id} className="border border-border/70 hover:shadow-warm transition-all rounded-3xl overflow-hidden bg-card flex flex-col md:flex-row justify-between items-center p-5 gap-4">
                              <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="h-20 w-20 rounded-2xl overflow-hidden bg-sand/20 border shrink-0">
                                  <img 
                                    src={getPropertyImage(prop, 200)} 
                                    alt={booking.event_name} 
                                    className="h-full w-full object-cover" 
                                  />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[10px] font-bold text-warm-muted block tracking-wider uppercase">Ref: {booking.booking_number || `BK-${booking.id}`}</span>
                                  <h3 className="font-extrabold text-base text-foreground line-clamp-1">{prop?.name || "Ahir Samaj Community Hall"}</h3>
                                  <span className="text-xs text-warm-muted block font-medium mt-1">
                                    Date: {formatDateLong(booking.start_date)} to {formatDateLong(booking.end_date || booking.start_date)}
                                  </span>
                                  <span className="text-xs text-warm-muted block font-medium">Time: {booking.start_time} - {booking.end_time}</span>
                                </div>
                              </div>
                              <div className="flex flex-col md:items-end justify-between w-full md:w-auto gap-3 shrink-0">
                                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-1">
                                  <span className="font-extrabold text-lg text-foreground">{formatCurrency(booking.total_amount)}</span>
                                  <Badge variant="outline" className={`${statusColors[booking.status] || 'bg-gray-50 text-gray-700'} rounded-md font-bold text-[9px] uppercase tracking-wider`}>
                                    {booking.status}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedBookingForDetails(booking)}
                                  className="bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold px-4 h-9 shadow-warm w-full md:w-auto"
                                >
                                  View Details
                                </Button>
                              </div>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  /* BOOKING DETAILS VIEW (Screen 10) */
                  <div className="space-y-6 max-w-5xl mx-auto animate-fade-in font-sans">
                    <div 
                      onClick={() => setSelectedBookingForDetails(null)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark cursor-pointer transition-colors w-fit"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to My Bookings
                    </div>

                    <Card className="border border-border/80 shadow-warm rounded-3xl overflow-hidden bg-card">
                      <CardHeader className="border-b p-6 pb-4 flex flex-row items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-warm-muted block tracking-wider uppercase">Booked on {formatDateLong(selectedBookingForDetails.created_at || new Date())}</span>
                          <CardTitle className="text-xl font-extrabold">Booking Ref: {selectedBookingForDetails.booking_number}</CardTitle>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[10px] uppercase tracking-wider">
                          {selectedBookingForDetails.status}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                          
                          {/* Image and basic info */}
                          <div className="md:col-span-4 space-y-4">
                            <div className="h-48 w-full rounded-2xl overflow-hidden bg-sand/20 border shadow-inner">
                              <img 
                                src={getPropertyImage(properties.find(p => p.id === selectedBookingForDetails.property), 400)} 
                                alt="property" 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {properties.find(p => p.id === selectedBookingForDetails.property)?.photos?.slice(0, 4).map((ph: string, idx: number) => (
                                <div key={idx} className="aspect-square rounded-lg overflow-hidden border">
                                  <img src={ph} alt="thumb" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Detail Grid */}
                          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Left Column: Booking Info */}
                            <div className="space-y-4">
                              <h4 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b pb-1">Booking Information</h4>
                              <div className="space-y-2.5 text-xs text-warm-muted">
                                <div className="flex justify-between"><span className="font-medium">Property</span><span className="font-bold text-foreground">{properties.find(p => p.id === selectedBookingForDetails.property)?.name}</span></div>
                                <div className="flex justify-between"><span className="font-medium">Resources</span><span className="font-bold text-foreground">{selectedBookingForDetails.resources?.map((rId: number) => resources.find(r => r.id === rId)?.name).join(", ") || "None"}</span></div>
                                <div className="flex justify-between"><span className="font-medium">Date & Time</span><span className="font-bold text-foreground text-right">{selectedBookingForDetails.start_date} to {selectedBookingForDetails.end_date || selectedBookingForDetails.start_date}</span></div>
                                <div className="flex justify-between"><span className="font-medium">Duration</span><span className="font-bold text-foreground">{getBookingDurationDays(selectedBookingForDetails.start_date, selectedBookingForDetails.end_date)} Day(s)</span></div>
                                <div className="flex justify-between"><span className="font-medium">Expected Guests</span><span className="font-bold text-foreground">{selectedBookingForDetails.expected_guests} People</span></div>
                                <div className="flex justify-between"><span className="font-medium">Contact Person</span><span className="font-bold text-foreground">{user?.name}</span></div>
                                <div className="flex justify-between"><span className="font-medium">Mobile</span><span className="font-bold text-foreground">{(user as any)?.phone || '98765 43210'}</span></div>
                                <div className="flex justify-between"><span className="font-medium">Email</span><span className="font-bold text-foreground">{user?.email}</span></div>
                              </div>
                            </div>

                            {/* Right Column: Price and Payments */}
                            <div className="space-y-6">
                              <div className="space-y-4">
                                <h4 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b pb-1">Price Details</h4>
                                <div className="space-y-2.5 text-xs text-warm-muted">
                                  <div className="flex justify-between"><span>Subtotal</span><span className="font-bold text-foreground">{formatCurrency(selectedBookingForDetails.base_amount)}</span></div>
                                  <div className="flex justify-between"><span>Taxes (18%)</span><span className="font-bold text-foreground">{formatCurrency(selectedBookingForDetails.tax_amount)}</span></div>
                                  <div className="flex justify-between"><span>Security Deposit</span><span className="font-bold text-foreground">{formatCurrency(selectedBookingForDetails.deposit_amount)}</span></div>
                                  <div className="flex justify-between border-t pt-2 text-sm font-extrabold text-primary"><span>Total Amount</span><span>{formatCurrency(selectedBookingForDetails.total_amount)}</span></div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b pb-1">Payment Information</h4>
                                <div className="space-y-2.5 text-xs text-warm-muted">
                                  <div className="flex justify-between"><span>Method</span><span className="font-bold text-foreground">{selectedBookingForDetails.payment_method || 'Online Payment'}</span></div>
                                  <div className="flex justify-between"><span>Status</span><span className="font-bold text-foreground">{selectedBookingForDetails.payment_status}</span></div>
                                  <div className="flex justify-between"><span>Transaction ID</span><span className="font-bold text-foreground font-mono">{selectedBookingForDetails.payment_reference || 'Pending'}</span></div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Action Buttons Panel */}
                        <div className="border-t pt-5 flex flex-wrap gap-3 justify-end">
                          <Button 
                            variant="outline"
                            onClick={() => {
                              toast.success("Receipt downloaded successfully!");
                            }}
                            className="rounded-xl h-10 px-4 font-semibold text-xs flex items-center gap-1.5 border-border/70"
                          >
                            <FileText className="h-4.5 w-4.5 text-primary" /> Download Receipt
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              toast.info("Reschedule request submitted to administrator.");
                            }}
                            className="rounded-xl h-10 px-4 font-semibold text-xs border-border/70"
                          >
                            Reschedule Booking
                          </Button>
                          {['Pending Approval', 'Pending Payment'].includes(selectedBookingForDetails.status) && (
                            <Button 
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await api.updateVenueBooking(selectedBookingForDetails.id, { status: 'Cancelled' });
                                  toast.success("Booking cancelled successfully.");
                                  setSelectedBookingForDetails(null);
                                  fetchData();
                                } catch (e) {
                                  toast.error("Failed to cancel booking.");
                                }
                              }}
                              className="rounded-xl h-10 px-4 font-semibold text-xs border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Cancel Booking
                            </Button>
                          )}
                          <Button 
                            variant="outline"
                            onClick={() => {
                              toast.info("Support contact: 98765 43210 / support@samaj.org");
                            }}
                            className="rounded-xl h-10 px-4 font-semibold text-xs border-border/70"
                          >
                            Contact Property
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* WAITING LIST TAB */}
            {activeView === 'waiting' && (
              <div className="bg-card rounded-2xl border border-border/70 p-6 space-y-6 shadow-warm">
                <div>
                  <h2 className="text-xl font-bold text-foreground">My Active Waiting Lists</h2>
                  <p className="text-xs text-warm-muted">Join queues for highly contested days. If someone cancels, you will be alerted immediately.</p>
                </div>

                {waitingList.length === 0 ? (
                  <div className="border-2 border-dashed border-border/60 rounded-2xl py-12 flex flex-col items-center justify-center text-warm-muted text-center max-w-md mx-auto space-y-3">
                    <ClipboardCheck className="h-10 w-10 text-warm-muted/40" />
                    <p className="text-sm font-bold text-foreground">No Active Waiting Lists</p>
                    <p className="text-xs text-warm-muted">Choose a property in the browse catalog and check blocked dates to queue.</p>
                  </div>
                ) : (
                  <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-sand/20 font-semibold text-warm-muted uppercase text-[9px] tracking-wider border-b border-border/40">
                        <tr>
                          <th className="px-6 py-3">Property</th>
                          <th className="px-6 py-3">Queued Date</th>
                          <th className="px-6 py-3 text-center">Queue Position</th>
                          <th className="px-6 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {waitingList.map(wait => {
                          const prop = properties.find(p => p.id === wait.property);
                          return (
                            <tr key={wait.id} className="hover:bg-sand/5">
                              <td className="px-6 py-4 font-bold text-foreground">{prop?.name || "Community Hall"}</td>
                              <td className="px-6 py-4 text-warm-muted">{formatDateLong(wait.start_date)}</td>
                              <td className="px-6 py-4 text-center">
                                <Badge className="bg-primary/15 text-primary border border-primary/20 rounded font-bold">
                                  Position #{wait.position || 1}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Badge variant="outline" className={`${wait.notified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} rounded font-semibold text-[10px]`}>
                                  {wait.notified ? 'Notified / Ready' : 'Pending Open'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PAYMENTS TAB */}
            {activeView === 'payments' && (
              <div className="bg-card rounded-2xl border border-border/70 p-6 space-y-6 shadow-warm">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Transaction Ledgers & Payments</h2>
                  <p className="text-xs text-warm-muted font-medium">View past invoices, security deposit refund statuses, and receipts.</p>
                </div>

                <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-sand/20 font-semibold text-warm-muted uppercase text-[9px] tracking-wider border-b border-border/40">
                      <tr>
                        <th className="px-6 py-3">Booking ID</th>
                        <th className="px-6 py-3">Venue</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Method</th>
                        <th className="px-6 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {bookings.map(booking => {
                        const prop = properties.find(p => p.id === booking.property);
                        return (
                          <tr key={booking.id} className="hover:bg-sand/5">
                            <td className="px-6 py-4 font-mono font-bold text-foreground">{booking.booking_number}</td>
                            <td className="px-6 py-4 text-warm-muted">{prop?.name}</td>
                            <td className="px-6 py-4 font-bold text-foreground">{formatCurrency(booking.total_amount)}</td>
                            <td className="px-6 py-4 text-warm-muted">{booking.payment_method || 'Online'}</td>
                            <td className="px-6 py-4 text-right">
                              <Badge variant="outline" className={`${booking.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} rounded font-semibold text-[10px]`}>
                                {booking.payment_status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* INVOICES TAB */}
            {activeView === 'invoices' && (
              <div className="bg-card rounded-2xl border border-border/70 p-6 space-y-6 shadow-warm">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Printable Invoices</h2>
                  <p className="text-xs text-warm-muted font-medium">Download formal GST compliant tax statements for your accounting.</p>
                </div>

                <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-sand/20 font-semibold text-warm-muted uppercase text-[9px] tracking-wider border-b border-border/40">
                      <tr>
                        <th className="px-6 py-3">Invoice Number</th>
                        <th className="px-6 py-3">Property space</th>
                        <th className="px-6 py-3">Total Billed</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {bookings.map(booking => {
                        const prop = properties.find(p => p.id === booking.property);
                        return (
                          <tr key={booking.id} className="hover:bg-sand/5">
                            <td className="px-6 py-4 font-mono font-bold text-foreground">{booking.invoice_number}</td>
                            <td className="px-6 py-4 text-warm-muted">{prop?.name}</td>
                            <td className="px-6 py-4 font-bold text-foreground">{formatCurrency(booking.total_amount)}</td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedBookingForDetails(booking);
                                  setActiveView('bookings');
                                }}
                                className="text-primary hover:text-primary-dark font-bold text-xs"
                              >
                                View Invoice
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
