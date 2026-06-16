import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Calendar, 
  Grid3x3, 
  List, 
  MapPin, 
  Users, 
  Clock, 
  Share2, 
  User, 
  Sparkles, 
  Award, 
  Map, 
  MapPinned,
  ChevronRight,
  Info,
  CheckCircle,
  X,
  FileText,
  Loader2,
  CalendarDays,
  Search,
  SlidersHorizontal,
  BookmarkCheck,
  Check
} from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal, StatusBadge } from "@/components/wag/primitives";
import { useAuth } from "@/context/AuthContext";
import { api, getImageUrl } from "@/lib/api";

export const Route = createFileRoute("/dashboard/events")({
  component: MemberEventsDashboard,
});

function MemberEventsDashboard() {
  const { user } = useAuth();
  
  // State
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list" | "calendar">("grid");
  const [activeTab, setActiveTab] = useState<"discover" | "my-events">("discover");
  
  // Detail & Registration Modals
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [registerEvent, setRegisterEvent] = useState<any | null>(null);
  
  // Registration Form
  const [regForm, setRegForm] = useState({
    name: user?.name || "",
    phone: "",
    email: user?.email || "",
    familyCount: "0",
    familyNames: "",
    specialNotes: ""
  });
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regSuccess, setRegSuccess] = useState<any | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchData = async () => {
    try {
      const commId = user?.communityId;
      const ancestors = commId ? await api.getAncestorCommunityIds(commId) : [];
      const filterQuery = ancestors.join(",");

      const [eventsRes, regRes] = await Promise.all([
        api.getEvents({ community_id: filterQuery }),
        api.getEventRegistrations()
      ]);
      setEvents(eventsRes || []);
      setRegistrations(regRes || []);
    } catch (err) {
      console.error("Failed to fetch event data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 8-second polling for real-time seat counts and updates
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEvent) return;
    if (!regForm.name || !regForm.phone || !regForm.email) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmittingReg(true);
    try {
      const familyAttendingCount = parseInt(regForm.familyCount) || 0;
      const totalAttendees = 1 + familyAttendingCount;

      const payload = {
        event: registerEvent.id,
        name: regForm.name,
        email: regForm.email,
        phone: regForm.phone,
        attendees: totalAttendees,
        family_members_attending: regForm.familyNames,
        special_notes: regForm.specialNotes,
        status: "Registered"
      };

      const res = await api.createEventRegistration(payload);
      
      setRegSuccess({
        eventName: registerEvent.title,
        attendeesCount: totalAttendees
      });

      // Refetch for real-time counts
      fetchData();
      
      // Update local seats count directly for instant UI refresh
      setEvents(prev => 
        prev.map(item => 
          item.id === registerEvent.id 
            ? { ...item, attendees: (item.attendees || 0) + totalAttendees }
            : item
        )
      );

      // If viewing detail modal, sync its attendee count too
      if (selectedEvent && selectedEvent.id === registerEvent.id) {
        setSelectedEvent((prev: any) => ({
          ...prev,
          attendees: (prev.attendees || 0) + totalAttendees
        }));
      }

      setRegForm({
        name: user?.name || "",
        phone: "",
        email: user?.email || "",
        familyCount: "0",
        familyNames: "",
        specialNotes: ""
      });

    } catch (err: any) {
      alert("Registration failed: " + (err.message || "Unknown error"));
    } finally {
      setSubmittingReg(false);
    }
  };

  // Visibility Rules:
  // Show events created by user's community, parent community, or public/full hierarchy scope
  const visibleEvents = events.filter(e => {
    // Exclude Drafts and Pending Approvals from members
    if (e.status === "Draft" || e.status === "Pending Approval") return false;
    
    if (!user) return true;
    const matchesCommunity = 
      String(e.community) === String(user.communityId) || 
      e.community_name === user.communityName || 
      (user.parentCommunityName && e.community_name === user.parentCommunityName);
      
    const matchesScope = 
      e.visibility_scope === "PUBLIC" || 
      e.visibility_scope === "FULL_HIERARCHY";
      
    return matchesCommunity || matchesScope;
  });

  // Calculate user registered event IDs
  const myRegistrations = registrations.filter(r => r.email === user?.email || r.phone === (user as any)?.phone);
  const myRegisteredEventIds = new Set(myRegistrations.map(r => r.event));

  // Category list extraction
  const categories = ["All", ...Array.from(new Set(visibleEvents.map(e => e.category || e.type || "Other")))];

  // Filter events based on search & category
  const filteredEvents = visibleEvents.filter(e => {
    const categoryName = e.category || e.type || "Other";
    const matchesCategory = selectedCategory === "All" || categoryName === selectedCategory;
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.organizer || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesCategory && matchesSearch;
  });

  // Filter for tab "My Events"
  const myEventsList = visibleEvents.filter(e => myRegisteredEventIds.has(e.id));

  // Calculations for stats
  const upcomingEventsCount = visibleEvents.filter(e => new Date(e.date) >= new Date() && e.status !== "Completed" && e.status !== "Cancelled").length;
  const ongoingEventsCount = visibleEvents.filter(e => e.status === "Ongoing").length;
  const totalRegistrationsCount = myRegistrations.length;

  // Function to copy share link
  const handleShareEvent = (event: any) => {
    const url = `${window.location.origin}/dashboard/events?eventId=${event.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Event link copied to clipboard!");
    });
  };

  // Add event to calendar (.ics generation)
  const handleAddToCalendar = (event: any) => {
    const title = encodeURIComponent(event.title);
    const desc = encodeURIComponent(event.desc || "");
    const location = encodeURIComponent(event.venue || "");
    const dateStr = event.date.replace(/-/g, "");
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Samaj//CommunityEvents//EN
BEGIN:VEVENT
UID:uid_${event.id}@samaj.org
DTSTAMP:${dateStr}T100000Z
DTSTART:${dateStr}T100000Z
DTEND:${dateStr}T120000Z
SUMMARY:${event.title}
DESCRIPTION:${event.desc || ""}
LOCATION:${event.venue || ""}
END:VEVENT
END:VCALENDAR`;
    
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${event.title.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageWrap 
      title="Samaj Events Portal" 
      desc="Cultural festivals, sports events, educational seminars, and community meets."
      action={
        <div className="flex bg-sand/80 p-1 rounded-xl border border-warm/80">
          <button 
            onClick={() => setActiveTab("discover")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "discover" ? "bg-primary text-white shadow-sm" : "text-warm-muted hover:text-foreground"}`}
          >
            Discover Events
          </button>
          <button 
            onClick={() => setActiveTab("my-events")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "my-events" ? "bg-primary text-white shadow-sm" : "text-warm-muted hover:text-foreground"}`}
          >
            My Registered Events ({myEventsList.length})
          </button>
        </div>
      }
    >
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-surface border border-warm shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-warm-muted block">Upcoming Events</span>
            <span className="text-xl font-bold font-ui text-foreground">{upcomingEventsCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-warm shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gold/10 text-gold animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-warm-muted block">Ongoing Events</span>
            <span className="text-xl font-bold font-ui text-foreground">{ongoingEventsCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-warm shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-teal/10 text-teal">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-warm-muted block">Platform Bookings</span>
            <span className="text-xl font-bold font-ui text-foreground">
              {events.reduce((sum, e) => sum + (e.attendees || 0), 0)} Seats
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-warm shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-teal/10 text-teal">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-warm-muted block">My Registrations</span>
            <span className="text-xl font-bold font-ui text-foreground">{totalRegistrationsCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Filters & Views Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-warm-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search event, venue, city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category Picker */}
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-warm-muted" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-warm bg-surface font-semibold outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-sand p-1 rounded-xl border border-warm/40">
          {(["grid", "list", "calendar"] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`p-2 rounded-lg transition-all ${
                view === mode ? "bg-surface text-primary shadow-sm" : "text-warm-muted hover:text-foreground"
              }`}
              title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} View`}
            >
              {mode === "grid" && <Grid3x3 className="w-4 h-4" />}
              {mode === "list" && <List className="w-4 h-4" />}
              {mode === "calendar" && <Calendar className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        /* 4. Display Content based on Selected Tab */
        (() => {
          const currentList = activeTab === "discover" ? filteredEvents : myEventsList;

          if (currentList.length === 0) {
            return (
              /* Empty State */
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-warm/80 bg-surface min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <CalendarDays className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="font-ui font-bold text-lg text-foreground mb-1">No upcoming community events at the moment.</h3>
                <p className="text-sm text-warm-muted max-w-sm mb-6">
                  {activeTab === "discover" 
                    ? "We couldn't find any upcoming community events matching your filters." 
                    : "You haven't registered for any community events yet."}
                </p>
                {activeTab === "discover" && (
                  <button 
                    onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary/95 transition"
                  >
                    Explore Other Community Activities
                  </button>
                )}
              </div>
            );
          }

          if (view === "grid") {
            return (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentList.map(e => {
                  const seatsRemaining = Math.max(0, (e.max_attendees || 500) - (e.attendees || 0));
                  const isRegistered = myRegisteredEventIds.has(e.id);
                  const isClosed = seatsRemaining <= 0 || e.status === "Completed" || e.status === "Cancelled";

                  return (
                    <AnimatedCard key={e.id} className="flex flex-col justify-between border border-warm shadow-sm hover:shadow-md transition bg-surface">
                      <div>
                        {/* cover image */}
                        <div className="h-44 w-full bg-sand relative overflow-hidden">
                          {(e.img || e.img_url) ? (
                            <img src={getImageUrl(e.img || e.img_url)} alt={e.title} className="w-full h-full object-cover transition hover:scale-105 duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-teal/10 to-primary/10 flex items-center justify-center">
                              <CalendarDays className="w-12 h-12 text-primary/30" />
                            </div>
                          )}

                          {/* category tag */}
                          <span className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm border border-warm/60 px-2.5 py-1 rounded-full text-[10px] font-bold text-foreground">
                            {e.category || e.type || "Event"}
                          </span>

                          {/* status badge */}
                          <div className="absolute top-3 right-3">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold text-white shadow-sm ${
                              e.status === "Registration Open" || e.status === "Published" ? "bg-teal" :
                              e.status === "Ongoing" ? "bg-gold" :
                              e.status === "Completed" ? "bg-warm-muted" : "bg-red-500"
                            }`}>
                              {e.status === "Published" ? "Upcoming" : e.status}
                            </span>
                          </div>
                        </div>

                        {/* Event details content */}
                        <div className="p-5 pb-0">
                          <span className="text-[10px] font-bold tracking-wider text-gold uppercase block mb-1">
                            {e.community_name || user?.communityName || "Samaj Committee"}
                          </span>
                          <h4 className="font-ui font-bold text-base text-foreground leading-snug line-clamp-1 mb-2" title={e.title}>
                            {e.title}
                          </h4>
                          <p className="text-xs text-warm-muted line-clamp-2 leading-relaxed mb-4">
                            {e.desc}
                          </p>

                          <div className="space-y-2 text-xs text-warm-muted border-t border-warm/40 pt-3.5 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span>{new Date(e.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gold" />
                              <span>{e.start_time ? `${e.start_time} - ${e.end_time || "End"}` : e.time || "TBD"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-teal" />
                              <span className="line-clamp-1">{e.venue}</span>
                            </div>
                            {e.organizer && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-warm-muted" />
                                <span>Org: {e.organizer}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div className="p-5 pt-0">
                        {/* Attendance availability progress */}
                        <div className="mb-4">
                          <div className="flex justify-between text-[11px] text-warm-muted mb-1 font-semibold">
                            <span>{e.attendees || 0} Registered</span>
                            <span>{seatsRemaining} seats left</span>
                          </div>
                          <div className="w-full h-1.5 bg-sand rounded-full overflow-hidden border border-warm/30">
                            <div 
                              className="h-full bg-gradient-to-r from-teal to-primary rounded-full" 
                              style={{ width: `${Math.min(100, Math.round(((e.attendees || 0) / (e.max_attendees || 500)) * 100))}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedEvent(e)}
                            className="flex-1 py-2 rounded-xl border border-warm text-xs font-semibold text-warm-muted hover:bg-sand/30 hover:text-foreground transition-all flex items-center justify-center"
                          >
                            View Details
                          </button>
                          
                          {isRegistered ? (
                            <div className="flex-1 py-2 rounded-xl bg-teal/10 border border-teal/30 text-teal text-xs font-bold flex items-center justify-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Registered
                            </div>
                          ) : (
                            <button
                              disabled={isClosed}
                              onClick={() => {
                                setRegisterEvent(e);
                                setRegSuccess(null);
                              }}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                                isClosed 
                                  ? "bg-sand text-warm-muted cursor-not-allowed border border-warm/40" 
                                  : "bg-primary text-white hover:bg-primary/95 shadow-sm"
                              }`}
                            >
                              {seatsRemaining <= 0 ? "House Full" : "Register Now"}
                            </button>
                          )}
                        </div>

                        {/* Extra tiny action buttons */}
                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-warm/40 text-[10px] text-warm-muted font-medium">
                          <button onClick={() => handleShareEvent(e)} className="flex items-center gap-1 hover:text-primary transition">
                            <Share2 className="w-3 h-3" /> Share
                          </button>
                          <button onClick={() => handleAddToCalendar(e)} className="flex items-center gap-1 hover:text-primary transition">
                            <Calendar className="w-3 h-3" /> Add to Calendar
                          </button>
                        </div>

                      </div>
                    </AnimatedCard>
                  );
                })}
              </div>
            );
          }

          if (view === "list") {
            return (
              <AnimatedCard className="overflow-hidden border border-warm bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-sand text-xs uppercase tracking-wider text-warm-muted font-bold">
                      <tr>
                        <th className="p-3.5 text-left">Event</th>
                        <th className="p-3.5 text-left">Category</th>
                        <th className="p-3.5 text-left">Date & Time</th>
                        <th className="p-3.5 text-left">Venue</th>
                        <th className="p-3.5 text-left">Seats filled</th>
                        <th className="p-3.5 text-left">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm">
                      {currentList.map(e => {
                        const isRegistered = myRegisteredEventIds.has(e.id);
                        const progress = Math.min(100, Math.round(((e.attendees || 0) / (e.max_attendees || 500)) * 100));
                        return (
                          <tr key={e.id} className="hover:bg-sand/30 transition-colors">
                            <td className="p-3.5 font-bold text-foreground">
                              {e.title}
                            </td>
                            <td className="p-3.5">
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-warm/80 bg-sand/30">
                                {e.category || e.type}
                              </span>
                            </td>
                            <td className="p-3.5 text-xs text-warm-muted">
                              <div>{new Date(e.date).toLocaleDateString()}</div>
                              <div className="text-[10px]">{e.start_time || e.time || "TBD"}</div>
                            </td>
                            <td className="p-3.5 text-xs text-warm-muted">
                              {e.venue}
                            </td>
                            <td className="p-3.5 text-xs">
                              <div>{e.attendees || 0} / {e.max_attendees || 500} ({progress}%)</div>
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                                e.status === "Registration Open" || e.status === "Published" ? "bg-teal" :
                                e.status === "Ongoing" ? "bg-gold" : "bg-warm-muted"
                              }`}>
                                {e.status === "Published" ? "Upcoming" : e.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              <button 
                                onClick={() => setSelectedEvent(e)}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Details
                              </button>
                              {isRegistered ? (
                                <span className="text-xs font-bold text-teal">Registered</span>
                              ) : (
                                <button
                                  onClick={() => { setRegisterEvent(e); setRegSuccess(null); }}
                                  disabled={e.status === "Completed" || e.status === "Cancelled"}
                                  className="text-xs font-semibold text-teal hover:underline disabled:opacity-40"
                                >
                                  Register
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AnimatedCard>
            );
          }

          if (view === "calendar") {
            return (
              <AnimatedCard className="p-6 border border-warm bg-surface">
                <div className="grid grid-cols-7 gap-2.5 text-center text-xs font-bold text-warm-muted uppercase tracking-wider mb-4 border-b border-warm pb-2.5">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, index) => {
                    const dayNum = (index % 31) + 1;
                    const dateObj = new Date();
                    dateObj.setDate(dayNum);
                    
                    const dayEvents = currentList.filter(e => {
                      const evDate = new Date(e.date);
                      return evDate.getDate() === dayNum && evDate.getMonth() === dateObj.getMonth();
                    });

                    return (
                      <div 
                        key={index} 
                        className={`min-h-[70px] border border-warm/60 rounded-xl p-2 flex flex-col justify-between transition-all ${
                          dayEvents.length > 0 ? "bg-primary/5 border-primary/40 shadow-inner" : "bg-sand/10"
                        }`}
                      >
                        <span className="text-xs font-bold text-warm-muted">{dayNum}</span>
                        {dayEvents.slice(0, 1).map(e => (
                          <div 
                            key={e.id}
                            onClick={() => setSelectedEvent(e)}
                            className="text-[9px] font-bold bg-primary text-white truncate px-1.5 py-0.5 rounded cursor-pointer mt-1"
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 1 && (
                          <span className="text-[8px] text-warm-muted block text-right font-semibold">+{dayEvents.length - 1} more</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AnimatedCard>
            );
          }
        })()
      )}

      {/* ---------- MODAL 1: EVENT DETAILS ---------- */}
      <Modal
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Event Details"
        size="lg"
      >
        {selectedEvent && (() => {
          const seatsRemaining = Math.max(0, (selectedEvent.max_attendees || 500) - (selectedEvent.attendees || 0));
          const isRegistered = myRegisteredEventIds.has(selectedEvent.id);
          const isClosed = seatsRemaining <= 0 || selectedEvent.status === "Completed" || selectedEvent.status === "Cancelled";
          const progressPercent = Math.min(100, Math.round(((selectedEvent.attendees || 0) / (selectedEvent.max_attendees || 500)) * 100));

          // Mock schedule template fallback if none specified in DB
          const scheduleTimeline = selectedEvent.schedule && selectedEvent.schedule.length > 0 
            ? selectedEvent.schedule 
            : [
                { time: "09:00 AM", activity: "Registration & Welcome Tea" },
                { time: "10:00 AM", activity: "Inaugural Speech & Lamp Lighting" },
                { time: "11:00 AM", activity: "Main Ceremony / Keynote Session" },
                { time: "01:00 PM", activity: "Grand Community Lunch" },
                { time: "03:00 PM", activity: "Cultural Programs & Interactive Games" },
                { time: "05:30 PM", activity: "Vote of Thanks & High Tea" }
              ];

          // Mock speakers fallback
          const speakerList = selectedEvent.speakers && selectedEvent.speakers.length > 0
            ? selectedEvent.speakers
            : [
                { name: "Dr. Arvind Bhai Patel", designation: "Chief Guest & Community Patron", bio: "Renowned educationist and social entrepreneur with over 30 years of community service." },
                { name: "Shri Rajesh Patel", designation: "Samaj President", bio: "Leading industrialist and philanthropist dedicated to grass-root development projects." }
              ];

          return (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
              
              {/* Event Hero Banner */}
              <div className="relative rounded-2xl overflow-hidden h-56 bg-sand border border-warm/80">
                {(selectedEvent.img || selectedEvent.img_url) ? (
                  <img src={getImageUrl(selectedEvent.img || selectedEvent.img_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal/10 to-primary/10 flex items-center justify-center">
                    <CalendarDays className="w-16 h-16 text-primary/30" />
                  </div>
                )}
                
                {/* tags */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-surface/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-foreground border border-warm">
                    {selectedEvent.category || selectedEvent.type}
                  </span>
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold shadow">
                    {selectedEvent.community_name || user?.communityName || "Samaj Event"}
                  </span>
                </div>

                <div className="absolute top-4 right-4 bg-gold text-white px-2.5 py-1 rounded text-xs font-bold shadow-md">
                  {selectedEvent.status === "Published" ? "Upcoming" : selectedEvent.status}
                </div>
              </div>

              {/* Title & Key details */}
              <div>
                <h3 className="font-ui font-extrabold text-xl text-foreground leading-tight">
                  {selectedEvent.title}
                </h3>
                
                {/* Icons row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mt-4 text-xs text-warm-muted bg-sand/35 p-4 rounded-xl border border-warm/40">
                  <div>
                    <span className="text-[10px] text-warm-muted uppercase font-bold block mb-0.5">Date</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {new Date(selectedEvent.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-warm-muted uppercase font-bold block mb-0.5">Time</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gold" />
                      {selectedEvent.start_time ? `${selectedEvent.start_time} - ${selectedEvent.end_time || "End"}` : selectedEvent.time || "TBD"}
                    </span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-[10px] text-warm-muted uppercase font-bold block mb-0.5">Venue Location</span>
                    <span className="font-bold text-foreground flex items-center gap-1 truncate" title={selectedEvent.venue}>
                      <MapPin className="w-3.5 h-3.5 text-teal" />
                      {selectedEvent.venue}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid: Description & Timeline vs Details card */}
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Left Col: Description & timeline */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* About */}
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-warm-muted mb-2 border-b border-warm pb-1.5 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-primary" /> About the Event
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                      {selectedEvent.desc}
                    </p>
                    
                    {selectedEvent.venue_details && (
                      <div className="mt-4 p-3 bg-sand/20 rounded-xl border border-warm/40 text-xs text-warm-muted">
                        <span className="font-bold text-foreground block mb-1">Venue Details & Entry Rules:</span>
                        {selectedEvent.venue_details}
                      </div>
                    )}
                  </div>

                  {/* Schedule timeline */}
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-warm-muted mb-4 border-b border-warm pb-1.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gold" /> Event Timeline & Schedule
                    </h4>
                    <div className="relative pl-6 border-l-2 border-warm space-y-4 ml-2">
                      {scheduleTimeline.map((item: any, i: number) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-7.5 top-0.5 bg-primary/25 rounded-full p-1 border border-surface flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          </div>
                          <span className="text-[10px] font-bold text-primary">{item.time}</span>
                          <p className="text-xs font-semibold text-foreground mt-0.5">{item.activity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Speakers / Guests */}
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-warm-muted mb-4 border-b border-warm pb-1.5 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-teal" /> Special Guests & Speakers
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {speakerList.map((sp: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-warm/60 bg-sand/10 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs uppercase">
                              {sp.name.charAt(4) || "S"}
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-foreground leading-none">{sp.name}</h5>
                              <span className="text-[10px] text-gold font-semibold">{sp.designation}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-warm-muted leading-relaxed line-clamp-3">
                            {sp.bio}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Event Gallery */}
                  {selectedEvent.gallery && selectedEvent.gallery.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase font-bold tracking-wider text-warm-muted mb-3 border-b border-warm pb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary" /> Event Media Gallery
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedEvent.gallery.map((url: string, idx: number) => (
                          <div key={idx} className="h-20 rounded-lg overflow-hidden border border-warm">
                            <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Col: Registration summary, seats tracker, map */}
                <div className="space-y-5">
                  
                  {/* Booking Card */}
                  <div className="p-4 rounded-xl border border-warm bg-surface shadow-inner space-y-4">
                    <h5 className="font-ui font-bold text-xs uppercase tracking-wider text-foreground">Seat Availability</h5>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-warm-muted">Registered:</span>
                        <span className="text-foreground">{selectedEvent.attendees || 0} Members</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-warm-muted">Total Capacity:</span>
                        <span className="text-foreground">{selectedEvent.max_attendees || 500} Seats</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-warm-muted">Remaining:</span>
                        <span className={seatsRemaining > 0 ? "text-teal" : "text-red-500"}>
                          {seatsRemaining} Seats Available
                        </span>
                      </div>

                      {/* progress bar */}
                      <div className="pt-2">
                        <div className="w-full h-2.5 bg-sand rounded-full overflow-hidden border border-warm/30">
                          <div 
                            className="h-full bg-gradient-to-r from-teal to-primary" 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-warm-muted mt-1 block text-right font-medium">{progressPercent}% Booked</span>
                      </div>
                    </div>

                    <div className="border-t border-warm pt-3.5">
                      {isRegistered ? (
                        <div className="w-full py-2.5 rounded-lg bg-teal/10 border border-teal/30 text-teal text-xs font-bold flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Already Registered
                        </div>
                      ) : (
                        <button
                          disabled={isClosed}
                          onClick={() => {
                            setSelectedEvent(null);
                            setRegisterEvent(selectedEvent);
                            setRegSuccess(null);
                          }}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center ${
                            isClosed 
                              ? "bg-sand text-warm-muted cursor-not-allowed border border-warm/30" 
                              : "bg-primary text-white hover:bg-primary/95"
                          }`}
                        >
                          {seatsRemaining <= 0 ? "House Full" : "Register Now"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Event Location Google Map widget placeholder */}
                  <div className="p-4 rounded-xl border border-warm bg-surface shadow-inner space-y-3">
                    <h5 className="font-ui font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <MapPinned className="w-4 h-4 text-primary" /> Venue Map
                    </h5>
                    
                    {/* Visual map box */}
                    <div className="h-32 w-full rounded-lg bg-sand/30 border border-warm/60 flex items-center justify-center text-center p-3 relative overflow-hidden group">
                      {/* Grid representation */}
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="space-y-1 relative z-10">
                        <MapPin className="w-6 h-6 text-primary mx-auto animate-bounce" />
                        <span className="text-[10px] font-bold text-foreground block">{selectedEvent.venue}</span>
                        <span className="text-[9px] text-warm-muted block">Direct google directions linked</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.venue)}`, "_blank")}
                      className="w-full py-1.5 rounded-lg border border-warm text-[10px] font-bold text-warm-muted hover:bg-sand/30 hover:text-foreground transition flex items-center justify-center gap-1"
                    >
                      <Map className="w-3.5 h-3.5" /> Get Directions
                    </button>
                  </div>

                </div>

              </div>

              {/* Bottom bar */}
              <div className="border-t border-warm pt-4 flex gap-2 justify-end">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-5 py-2.5 rounded-xl border border-warm text-xs font-bold text-warm-muted hover:bg-sand transition"
                >
                  Close View
                </button>
                {!isRegistered && !isClosed && (
                  <button 
                    onClick={() => {
                      setSelectedEvent(null);
                      setRegisterEvent(selectedEvent);
                      setRegSuccess(null);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 transition shadow-sm"
                  >
                    Register for Event
                  </button>
                )}
              </div>

            </div>
          );
        })()}
      </Modal>

      {/* ---------- MODAL 2: REGISTER NOW FORM ---------- */}
      <Modal
        open={!!registerEvent}
        onClose={() => {
          setRegisterEvent(null);
          setRegSuccess(null);
        }}
        title={regSuccess ? "Registration Confirmed" : `Register for ${registerEvent?.title}`}
      >
        {regSuccess ? (
          /* Registration Success Screen */
          <div className="text-center py-6 space-y-4.5">
            <div className="w-16 h-16 bg-teal/15 text-teal rounded-full flex items-center justify-center mx-auto border border-teal/20">
              <Check className="w-8 h-8 font-black" />
            </div>

            <div>
              <h3 className="font-ui font-extrabold text-lg text-foreground">See You There!</h3>
              <p className="text-xs text-warm-muted mt-1 px-2.5">
                You have successfully registered <span className="font-bold text-primary">{regSuccess.attendeesCount} attendees</span> for the event:
              </p>
              <p className="font-bold text-sm text-foreground mt-2 bg-sand/20 p-2.5 border border-warm/40 rounded-xl">
                "{regSuccess.eventName}"
              </p>
            </div>

            <div className="w-40 h-40 mx-auto bg-white p-2 border border-warm rounded-xl grid grid-cols-12 gap-px shadow-inner">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className={Math.random() > 0.45 ? "bg-foreground" : "bg-transparent"} />
              ))}
            </div>

            <p className="text-[10px] text-warm-muted">
              Scan this digital QR pass at the entrance of the venue. A confirmation copy is sent to {regForm.email || user?.email}.
            </p>

            <button
              onClick={() => {
                setRegisterEvent(null);
                setRegSuccess(null);
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow hover:bg-primary/95 transition"
            >
              Close Window
            </button>
          </div>
        ) : (
          /* Form details */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Name */}
            <div>
              <label className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block mb-1">Your Full Name *</label>
              <input 
                type="text" 
                required
                value={regForm.name}
                onChange={e => setRegForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ramesh Patel"
                className="w-full px-3.5 py-2 rounded-xl border border-warm bg-surface focus:border-primary outline-none text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Email */}
              <div>
                <label className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={regForm.email}
                  onChange={e => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ramesh@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-warm bg-surface focus:border-primary outline-none text-xs font-semibold"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block mb-1">Phone Number *</label>
                <input 
                  type="tel" 
                  required
                  value={regForm.phone}
                  onChange={e => setRegForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="E.g. +91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl border border-warm bg-surface focus:border-primary outline-none text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3.5 items-end">
              {/* Attendees count picker */}
              <div className="col-span-1">
                <label className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block mb-1">Family Count</label>
                <select 
                  value={regForm.familyCount}
                  onChange={e => setRegForm(prev => ({ ...prev, familyCount: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:border-primary outline-none text-xs font-semibold"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} Members</option>
                  ))}
                </select>
              </div>

              {/* Family Members list description */}
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block mb-1">Family Attending Names</label>
                <input 
                  type="text"
                  disabled={regForm.familyCount === "0"}
                  value={regForm.familyNames}
                  onChange={e => setRegForm(prev => ({ ...prev, familyNames: e.target.value }))}
                  placeholder="E.g. Savita (Wife), Rahul (Son)"
                  className="w-full px-3.5 py-2 rounded-xl border border-warm bg-surface focus:border-primary outline-none text-xs disabled:opacity-50"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block mb-1">Special Notes / Needs</label>
              <textarea 
                rows={2}
                value={regForm.specialNotes}
                onChange={e => setRegForm(prev => ({ ...prev, specialNotes: e.target.value }))}
                placeholder="Wheelchair access request, food allergy info, etc."
                className="w-full px-3.5 py-2 rounded-xl border border-warm bg-surface focus:border-primary outline-none text-xs resize-none"
              />
            </div>

            {/* Form actions */}
            <div className="flex gap-2.5 pt-3 border-t border-warm">
              <button 
                type="button"
                onClick={() => setRegisterEvent(null)}
                className="flex-1 py-2.5 rounded-xl border border-warm text-xs font-bold hover:bg-sand/30 transition text-warm-muted"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submittingReg}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold shadow hover:bg-primary/95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submittingReg && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Registration
              </button>
            </div>

          </form>
        )}
      </Modal>

    </PageWrap>
  );
}
