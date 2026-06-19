import { createFileRoute, useNavigate, useSearch, useRouterState } from "@tanstack/react-router";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  MessageSquare, Send, CheckCircle2, XCircle, AlertCircle, 
  Loader2, User, Search, Paperclip, Image as ImageIcon, Trash2, 
  FileText, Clock, ShieldCheck, MapPin, Briefcase, Building, ChevronRight,
  Eye, Heart, X, Check, Mail, Phone, Calendar, Award, Users, BarChart3, ArrowLeft,
  Menu, LogOut, LayoutDashboard, UsersRound, Building2, Bell, Settings, HandHeart, Network
} from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { api, getImageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/dashboard/messages")({
  component: MessagesPage,
});

type MessageRequest = {
  id: number;
  sender: number;
  receiver: number;
  sender_name: string;
  sender_photo: string | null;
  sender_profession: string | null;
  sender_village: string | null;
  sender_community_name: string | null;
  receiver_name: string;
  receiver_photo: string | null;
  receiver_profession: string | null;
  receiver_village: string | null;
  receiver_community_name: string | null;
  subject: string | null;
  introduction_message: string;
  reason: string;
  custom_reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type Conversation = {
  id: number;
  participant_1: number;
  participant_2: number;
  participant_1_details: {
    id: number;
    name: string;
    photo: string | null;
    profession: string | null;
    village: string | null;
    community_name: string | null;
  };
  participant_2_details: {
    id: number;
    name: string;
    photo: string | null;
    profession: string | null;
    village: string | null;
    community_name: string | null;
  };
  last_message: {
    id: number;
    content: string;
    created_at: string;
    sender_id: number;
    is_seen: boolean;
  } | null;
};

type MessageReaction = {
  id: number;
  emoji: string;
  member: number;
  member_name: string;
};

type Message = {
  id: number;
  conversation: number;
  sender: number;
  sender_name: string;
  sender_photo: string | null;
  content: string;
  image: string | null;
  file: string | null;
  is_seen: boolean;
  created_at: string;
  reply_to?: number | null;
  reply_to_details?: {
    id: number;
    content: string;
    sender: number;
    sender_name: string;
    image: string | null;
  } | null;
  reactions?: MessageReaction[];
};

function MessagesPage() {
  const { user, logout } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  const searchParams = useSearch({ from: "/dashboard/messages" }) as any;
  const navigate = useNavigate();

  const sidebarNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/hierarchy", label: "Hierarchy", icon: Network },
    { to: "/dashboard/profile", label: "My Profile", icon: User },
    { to: "/dashboard/family", label: "My Family", icon: UsersRound },
    { to: "/dashboard/directory", label: "Member Directory", icon: Users },
    { to: "/dashboard/business", label: "Business Directory", icon: Building2 },
    { to: "/dashboard/matrimony", label: "Matrimony", icon: Heart },
    { to: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
    { to: "/dashboard/events", label: "Events", icon: Calendar },
    { to: "/dashboard/donations", label: "Donations", icon: HandHeart },
    { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  // Selected state
  const [activeTab, setActiveTab] = useState<"chats" | "received" | "sent">("chats");
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MessageRequest | null>(null);
  
  // Data lists
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MessageRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<MessageRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Input fields
  const [newMessageText, setNewMessageText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Profile Drawer States
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [drawerMember, setDrawerMember] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Mobile / Tablet navigation states
  const [mobileActiveView, setMobileActiveView] = useState<"list" | "chat" | "request">("list");
  const [tabletShowSidebar, setTabletShowSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Extra UX features
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showMsgSearchInput, setShowMsgSearchInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice Recording simulation
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const recordingIntervalRef = useRef<any>(null);

  // Replies & Reactions
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<number | null>(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<number | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  
  // Emoji Picker simulation
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const popularEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  // Calling simulation
  const [activeCall, setActiveCall] = useState<{ type: "audio" | "video"; partner: any } | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const callIntervalRef = useRef<any>(null);

  // More menu dropdown
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find current Member ID
  const [members, setMembers] = useState<any[]>([]);
  useEffect(() => {
    api.getMembers().then(setMembers).catch(console.error);
  }, []);

  // Click/Touch outside active reaction picker or scrolling container closes it
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (activeReactionPickerId !== null || selectedMessageId !== null) {
        const activeId = activeReactionPickerId ?? selectedMessageId;
        const pickerEl = document.getElementById(`reaction-picker-${activeId}`);
        const messageEl = document.getElementById(`msg-${activeId}`);
        
        // If click is outside both the bubble itself and the popup picker, close it
        if (
          (!pickerEl || !pickerEl.contains(e.target as Node)) &&
          (!messageEl || !messageEl.contains(e.target as Node))
        ) {
          setActiveReactionPickerId(null);
          setSelectedMessageId(null);
        }
      }
    };

    const handleScroll = () => {
      if (activeReactionPickerId !== null || selectedMessageId !== null) {
        setActiveReactionPickerId(null);
        setSelectedMessageId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    
    const scrollContainer = document.getElementById("messages-scroll-container");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [activeReactionPickerId, selectedMessageId]);

  const currentMember = useMemo(() => {
    return members.find(m => m.email === user?.email);
  }, [members, user]);
  
  const currentMemberId = currentMember?.id || Number((user as any)?.member?.id || user?.id);

  // Load all connection and messaging data
  const loadData = async () => {
    setLoading(true);
    try {
      const [convs, recs, sents] = await Promise.all([
        api.getConversations(),
        api.getMessageRequests("receiver", "pending"),
        api.getMessageRequests("sender", "pending")
      ]);
      setConversations(convs || []);
      setReceivedRequests(recs || []);
      setSentRequests(sents || []);
    } catch (e) {
      console.error("Failed to load messaging data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMemberId]);

  // Handle URL deep-linking parameters (e.g. ?chat=1 or ?review=2)
  useEffect(() => {
    if (loading) return;
    
    if (searchParams.chat) {
      const chatObj = conversations.find(c => String(c.id) === String(searchParams.chat));
      if (chatObj) {
        setSelectedChat(chatObj);
        setSelectedRequest(null);
        setActiveTab("chats");
      }
    } else if (searchParams.review) {
      const reqObj = receivedRequests.find(r => String(r.id) === String(searchParams.review));
      if (reqObj) {
        setSelectedRequest(reqObj);
        setSelectedChat(null);
        setActiveTab("received");
      }
    }
  }, [searchParams, conversations, receivedRequests, loading]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    setActiveReactionPickerId(null);
    setSelectedMessageId(null);
    setReplyingToMessage(null);
    if (!selectedChat) {
      setMessages([]);
      return;
    }
    
    const fetchMessages = async (isFirstLoad = false) => {
      if (isFirstLoad) setMessagesLoading(true);
      try {
        const msgs = await api.getConversationMessages(selectedChat.id);
        setMessages(prev => {
          if (JSON.stringify(prev) === JSON.stringify(msgs)) {
            return prev;
          }
          return msgs || [];
        });
      } catch (e) {
        console.error("Failed to load messages", e);
      } finally {
        if (isFirstLoad) setMessagesLoading(false);
      }
    };

    fetchMessages(true);
    
    // Set up polling for messages every 2 seconds (real-time feel)
    const interval = setInterval(() => fetchMessages(false), 2000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const scrollToBottom = () => {
      const scrollContainer = document.getElementById("messages-scroll-container");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // Call simulation timer effect
  useEffect(() => {
    if (activeCall) {
      setCallDuration(0);
      callIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    }
    return () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, [activeCall]);

  // Simulated typing status indicator
  useEffect(() => {
    if (selectedChat) {
      setIsTyping(false);
      const startTyping = setTimeout(() => {
        setIsTyping(true);
      }, 2500);
      const stopTyping = setTimeout(() => {
        setIsTyping(false);
      }, 6500);
      return () => {
        clearTimeout(startTyping);
        clearTimeout(stopTyping);
      };
    }
  }, [selectedChat]);

  // Voice recording simulation functions
  const startRecording = () => {
    setIsRecording(true);
    setRecordTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = (send = true) => {
    clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    if (send && selectedChat) {
      // Create a mock audio message
      const mockAudioMsg: Message = {
        id: Date.now(),
        conversation: selectedChat.id,
        sender: currentMemberId,
        sender_name: "Me",
        sender_photo: currentMember?.photo || null,
        content: `🎤 Voice Message (${Math.floor(recordTime / 60)}:${String(recordTime % 60).padStart(2, '0')})`,
        image: null,
        file: "audio_mock.mp3", // Flag for audio UI rendering
        is_seen: false,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, mockAudioMsg]);
    }
    setRecordTime(0);
  };

  // Calling handlers
  const startAudioCall = (partner: any) => {
    setActiveCall({ type: "audio", partner });
  };

  const startVideoCall = (partner: any) => {
    setActiveCall({ type: "video", partner });
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const handleReactToggle = async (messageId: number, emoji: string) => {
    // Optimistic UI updates
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReactions = msg.reactions || [];
        const userReaction = existingReactions.find(r => r.member === currentMemberId);
        
        let updatedReactions;
        if (userReaction) {
          if (userReaction.emoji === emoji) {
            // Remove reaction
            updatedReactions = existingReactions.filter(r => r.member !== currentMemberId);
          } else {
            // Update reaction
            updatedReactions = existingReactions.map(r => 
              r.member === currentMemberId ? { ...r, emoji } : r
            );
          }
        } else {
          // Add new reaction
          updatedReactions = [...existingReactions, {
            id: Date.now(), // temporary ID
            emoji,
            member: currentMemberId,
            member_name: currentMember?.name || "Me"
          }];
        }
        return { ...msg, reactions: updatedReactions };
      }
      return msg;
    }));

    try {
      const res = await api.reactToMessage(messageId, emoji);
      if (res && res.reactions) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, reactions: res.reactions } : msg
        ));
      }
    } catch (e) {
      console.error("Failed to react to message", e);
    }
  };

  const scrollToMessage = (msgId: number) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 2000);
    }
  };

  // Prevent page scroll when drawer is open
  useEffect(() => {
    if (showProfileDrawer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showProfileDrawer]);

  const handleViewProfile = async (memberId: number) => {
    setShowProfileDrawer(true);
    setDrawerLoading(true);
    setDrawerMember(null);
    try {
      const details = await api.getMember(memberId);
      setDrawerMember(details);
    } catch (e) {
      console.error("Failed to fetch member profile", e);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Handle Approve Request
  const handleApprove = async (reqId: number) => {
    setActionLoading(true);
    setErrorMsg("");
    try {
      await api.approveMessageRequest(reqId);
      setSuccessMsg("Connection request approved! You can now chat.");
      
      // Reload everything
      const [convs, recs, sents] = await Promise.all([
        api.getConversations(),
        api.getMessageRequests("receiver", "pending"),
        api.getMessageRequests("sender", "pending")
      ]);
      setConversations(convs || []);
      setReceivedRequests(recs || []);
      setSentRequests(sents || []);

      setSelectedRequest(null);
      // Auto open the newly created conversation
      const approvedReq = receivedRequests.find(r => r.id === reqId);
      if (approvedReq) {
        const matchingConv = convs.find(c => 
          (c.participant_1 === approvedReq.sender && c.participant_2 === approvedReq.receiver) ||
          (c.participant_1 === approvedReq.receiver && c.participant_2 === approvedReq.sender)
        );
        if (matchingConv) {
          setSelectedChat(matchingConv);
          setActiveTab("chats");
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to approve connection request.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Request
  const handleReject = async (reqId: number) => {
    setActionLoading(true);
    setErrorMsg("");
    try {
      await api.rejectMessageRequest(reqId);
      setSuccessMsg("Connection request declined.");
      
      // Reload lists
      const recs = await api.getMessageRequests("receiver", "pending");
      setReceivedRequests(recs || []);
      
      setSelectedRequest(null);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to decline request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat) return;
    if (!newMessageText.trim() && !selectedImage && !selectedFile) return;

    setSendingMessage(true);
    setErrorMsg("");
    try {
      const newMsg = await api.sendMessage(
        selectedChat.id,
        newMessageText,
        selectedImage,
        selectedFile,
        replyingToMessage?.id
      );
      setMessages(prev => [...prev, newMsg]);
      
      // Reset inputs
      setNewMessageText("");
      setSelectedImage(null);
      setSelectedFile(null);
      setImagePreview(null);
      setReplyingToMessage(null);
      setActiveReactionPickerId(null);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle delete own message
  const handleDeleteMessage = async (msgId: number) => {
    try {
      await api.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (e) {
      console.error("Failed to delete message", e);
    }
  };

  // File/Image upload handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Helper to determine the other participant details
  const getChatPartner = (chat: Conversation) => {
    if (chat.participant_1 === currentMemberId) {
      return chat.participant_2_details;
    }
    return chat.participant_1_details;
  };

  // Helper to format date separators like WhatsApp
  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // Filtered lists based on search query
  const filteredConversations = conversations.filter(c => {
    const partner = getChatPartner(c);
    const nameMatch = partner.name.toLowerCase().includes(searchQuery.toLowerCase());
    const msgMatch = c.last_message?.content?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return nameMatch || msgMatch;
  });

  const filteredReceived = receivedRequests.filter(r => 
    r.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.introduction_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSent = sentRequests.filter(r => 
    r.receiver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.introduction_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-[100dvh] md:h-screen flex flex-col overflow-hidden">
      {/* ☰ Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Sidebar Slide-in from left */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-[80vw] max-w-[320px] bg-white z-[110] lg:hidden flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-warm flex items-center justify-between bg-sand/10">
                <span className="font-bold text-slate-800 text-lg">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center border border-warm/40 text-warm-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-grow overflow-y-auto p-4 space-y-1 scrollbar-none">
                {sidebarNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = path === item.to;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (item.to === "/dashboard/messages") {
                          setMobileActiveView("list");
                          setSelectedChat(null);
                          setSelectedRequest(null);
                        }
                        navigate({ to: item.to });
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-slate-700 hover:bg-sand/40"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all mt-4 border-t border-warm/40 pt-4"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        #messages-scroll-container::-webkit-scrollbar,
        .scrollbar-none::-webkit-scrollbar {
          display: none !important;
        }
        #messages-scroll-container,
        .scrollbar-none {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      <div className="fixed inset-0 z-40 bg-white flex flex-col h-[100dvh] w-screen md:relative md:inset-auto md:z-auto md:h-screen md:w-full md:flex-row md:overflow-hidden">
        
        {/* ─── LEFT SIDE: SIDEBAR (CHAT & REQUESTS LIST) ─── */}
        <div 
          className={`border-r border-warm flex flex-col h-full bg-white transition-all duration-300 flex-shrink-0 ${
            mobileActiveView === "list" ? "w-full flex" : "hidden md:flex"
          } ${
            tabletShowSidebar ? "w-full md:w-80 lg:w-[350px]" : "md:w-0 md:opacity-0 md:overflow-hidden lg:w-80 lg:opacity-100"
          }`}
        >
          {/* Mobile List Header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-warm bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-1 rounded-full hover:bg-sand text-warm-muted"
                title="Open Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="font-bold text-base text-slate-800">Messages</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {conversations.length} Active
              </span>
            </div>
          </div>
          {/* Tabs header */}
          <div className="grid grid-cols-3 border-b border-warm text-center font-bold text-xs bg-sand/20 sticky top-0 z-10 flex-shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab("chats"); setSelectedChat(conversations[0] || null); setSelectedRequest(null); }}
              className={`py-3 transition border-b-2 ${activeTab === "chats" ? "border-primary text-primary bg-white" : "border-transparent text-warm-muted hover:text-foreground"}`}
            >
              Chats ({conversations.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("received"); setSelectedRequest(receivedRequests[0] || null); setSelectedChat(null); }}
              className={`py-3 transition border-b-2 ${activeTab === "received" ? "border-primary text-primary bg-white" : "border-transparent text-warm-muted hover:text-foreground"}`}
            >
              Received ({receivedRequests.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("sent"); setSelectedRequest(sentRequests[0] || null); setSelectedChat(null); }}
              className={`py-3 transition border-b-2 ${activeTab === "sent" ? "border-primary text-primary bg-white" : "border-transparent text-warm-muted hover:text-foreground"}`}
            >
              Sent ({sentRequests.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-warm/40 relative sticky top-[44px] bg-white z-10 flex-shrink-0">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-sand/35 rounded-xl border border-warm/60 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-warm-muted absolute left-6 top-1/2 -translate-y-1/2" />
          </div>

          {/* List display */}
          <div className="flex-1 overflow-y-auto divide-y divide-warm/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-warm-muted text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Loading messaging data...</span>
              </div>
            ) : (
              <>
                {/* Active Chats List */}
                {activeTab === "chats" && (
                  filteredConversations.length > 0 ? (
                    filteredConversations.map(c => {
                      const partner = getChatPartner(c);
                      const isSelected = selectedChat?.id === c.id;
                      const hasUnread = c.last_message && !c.last_message.is_seen && c.last_message.sender_id !== currentMemberId;
                      
                      return (
                        <div
                          key={c.id}
                          onClick={() => { 
                            setSelectedChat(c); 
                            setSelectedRequest(null); 
                            setMobileActiveView("chat");
                          }}
                          className={`p-3.5 cursor-pointer transition flex items-start gap-3 hover:bg-sand/10 hover:shadow-xs relative ${
                            isSelected ? "bg-sand/20 border-l-4 border-primary" : ""
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center overflow-hidden flex-shrink-0 border border-warm/40 relative">
                            {partner.photo ? (
                              <img src={getImageUrl(partner.photo)} alt={partner.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-warm-muted" />
                            )}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h4 className={`text-xs font-black truncate ${hasUnread ? "text-foreground" : "text-slate-800"}`}>
                                {partner.name}
                              </h4>
                              {c.last_message && (
                                <span className="text-[9px] text-warm-muted font-bold whitespace-nowrap">
                                  {new Date(c.last_message.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] truncate ${hasUnread ? "text-foreground font-black" : "text-warm-muted"}`}>
                              {c.last_message ? c.last_message.content : "No messages yet."}
                            </p>
                            <span className="text-[9px] text-warm-muted/70 font-semibold block mt-0.5">
                              📁 {partner.community_name || "Samaj"}
                            </span>
                          </div>
                          {hasUnread && (
                            <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-2 animate-pulse" />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-warm-muted text-xs">
                      <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                      <span>No active chats found.</span>
                    </div>
                  )
                )}

                {/* Received Requests List */}
                {activeTab === "received" && (
                  filteredReceived.length > 0 ? (
                    filteredReceived.map(r => {
                      const isSelected = selectedRequest?.id === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => { 
                            setSelectedRequest(r); 
                            setSelectedChat(null); 
                            setMobileActiveView("request");
                          }}
                          className={`p-3.5 cursor-pointer transition flex items-start gap-3 hover:bg-sand/10 hover:shadow-xs relative ${
                            isSelected ? "bg-sand/20 border-l-4 border-primary" : ""
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center overflow-hidden flex-shrink-0 border border-warm/40">
                            {r.sender_photo ? (
                              <img src={getImageUrl(r.sender_photo)} alt={r.sender_name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-warm-muted" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-slate-800 truncate">{r.sender_name}</h4>
                            <p className="text-[10px] text-warm-muted truncate mt-0.5">{r.introduction_message}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                {r.reason}
                              </span>
                              <span className="text-[9px] text-warm-muted/70 font-bold">
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-warm-muted self-center" />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-warm-muted text-xs">No pending received requests.</div>
                  )
                )}

                {/* Sent Requests List */}
                {activeTab === "sent" && (
                  filteredSent.length > 0 ? (
                    filteredSent.map(r => {
                      const isSelected = selectedRequest?.id === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => { 
                            setSelectedRequest(r); 
                            setSelectedChat(null); 
                            setMobileActiveView("request");
                          }}
                          className={`p-3.5 cursor-pointer transition flex items-start gap-3 hover:bg-sand/10 hover:shadow-xs relative ${
                            isSelected ? "bg-sand/20 border-l-4 border-primary" : ""
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center overflow-hidden flex-shrink-0 border border-warm/40">
                            {r.receiver_photo ? (
                              <img src={getImageUrl(r.receiver_photo)} alt={r.receiver_name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-warm-muted" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-slate-800 truncate">{r.receiver_name}</h4>
                            <p className="text-[10px] text-warm-muted truncate mt-0.5">{r.introduction_message}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sand border border-warm/65 text-warm-muted uppercase">
                                Pending Approval
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-warm-muted text-xs">No pending sent requests.</div>
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* ─── RIGHT SIDE: WORKSPACE (CHAT VIEW OR REQUEST PANE) ─── */}
        <div 
          className={`flex-1 flex flex-col h-full bg-sand/5 relative transition-all duration-300 ${
            mobileActiveView === "list" ? "hidden md:flex" : "flex w-full"
          }`}
        >
          {/* Notifications banner */}
          {errorMsg && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-md max-w-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg("")} className="ml-auto font-bold text-rose-500">×</button>
            </div>
          )}

          {successMsg && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-md max-w-md">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg("")} className="ml-auto font-bold text-emerald-500">×</button>
            </div>
          )}

          {/* Render Active Chat View */}
          {selectedChat ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Chat Header (Sticky) */}
              {(() => {
                const partner = getChatPartner(selectedChat);
                return (
                  <div className="p-3 bg-white border-b border-warm flex items-center justify-between shadow-xs z-10 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mobile Hamburger Menu Button */}
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="lg:hidden p-1.5 rounded-full hover:bg-sand text-warm-muted"
                        title="Open Navigation"
                      >
                        <Menu className="w-5 h-5" />
                      </button>

                      {/* Tablet Sidebar Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setTabletShowSidebar(!tabletShowSidebar)}
                        className="hidden md:flex lg:hidden p-1.5 rounded-full hover:bg-sand text-warm-muted"
                        title="Toggle Sidebar"
                      >
                        <Search className="w-4 h-4 rotate-90" />
                      </button>

                      <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center overflow-hidden border border-warm/40 relative flex-shrink-0">
                        {partner.photo ? (
                          <img src={getImageUrl(partner.photo)} alt={partner.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-warm-muted" />
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                      </div>
                      
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-xs text-slate-800 truncate">{partner.name}</h3>
                        <p className="text-[9px] text-warm-muted font-bold flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                          <span className="text-emerald-600 font-extrabold">Online</span>
                          <span className="opacity-50">•</span>
                          <span>{partner.profession || "Community Member"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startAudioCall(partner)}
                        className="p-2 rounded-xl hover:bg-sand text-warm-muted hover:text-slate-800 transition"
                        title="Audio Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startVideoCall(partner)}
                        className="p-2 rounded-xl hover:bg-sand text-warm-muted hover:text-slate-800 transition"
                        title="Video Call"
                      >
                        <Award className="w-4 h-4" /> {/* Represent video call using award as custom video style camera icon */}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMsgSearchInput(!showMsgSearchInput)}
                        className={`p-2 rounded-xl hover:bg-sand transition ${showMsgSearchInput ? "text-primary bg-sand" : "text-warm-muted"}`}
                        title="Search Messages"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewProfile(partner.id)}
                        className="p-2 rounded-xl hover:bg-sand text-warm-muted hover:text-slate-800 transition"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* More Menu Dropdown trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowMoreMenu(!showMoreMenu)}
                          className="p-2 rounded-xl hover:bg-sand text-warm-muted hover:text-slate-800 transition"
                          title="More Options"
                        >
                          <ChevronRight className="w-4 h-4 rotate-90" />
                        </button>
                        {showMoreMenu && (
                          <div className="absolute right-0 mt-1.5 w-40 bg-white border border-warm rounded-xl shadow-lg z-30 py-1 text-xs">
                            <button
                              type="button"
                              onClick={() => { setShowMoreMenu(false); alert("History cleared."); }}
                              className="w-full text-left px-3 py-2 hover:bg-sand/30 text-slate-700 font-bold"
                            >
                              Clear Chat History
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowMoreMenu(false); alert("Member blocked."); }}
                              className="w-full text-left px-3 py-2 hover:bg-sand/30 text-rose-600 font-bold"
                            >
                              Block Member
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Local Message Search Sub-bar */}
              {showMsgSearchInput && (
                <div className="p-2 bg-white border-b border-warm flex items-center gap-2 flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Search inside this conversation..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-1 bg-sand/30 border border-warm rounded-lg text-[11px]"
                  />
                  <button 
                    type="button" 
                    onClick={() => { setMessageSearchQuery(""); setShowMsgSearchInput(false); }}
                    className="text-xs font-bold text-warm-muted"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Messages display list (Scrolls independently) */}
              <div id="messages-scroll-container" className="flex-1 overflow-y-auto p-4 flex flex-col">
                {messagesLoading && messages.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  (() => {
                    const displayMsgs = messageSearchQuery 
                      ? messages.filter(m => m.content.toLowerCase().includes(messageSearchQuery.toLowerCase()))
                      : messages;

                    return displayMsgs.map((m, index) => {
                      const isOwn = m.sender === currentMemberId;
                      const isHighlighted = highlightedMsgId === m.id;
                      const isConsecutive = index > 0 && displayMsgs[index - 1].sender === m.sender;
                      const msgDate = new Date(m.created_at).toDateString();
                      const prevMsgDate = index > 0 ? new Date(displayMsgs[index - 1].created_at).toDateString() : null;
                      const showDateSeparator = msgDate !== prevMsgDate;
                      
                      // Compute reaction groups
                      const reactionGroups = (() => {
                        if (!m.reactions || !Array.isArray(m.reactions)) return {};
                        const groups: Record<string, { count: number; users: string[]; userReacted: boolean }> = {};
                        m.reactions.forEach(r => {
                          if (!groups[r.emoji]) {
                            groups[r.emoji] = { count: 0, users: [], userReacted: false };
                          }
                          groups[r.emoji].count += 1;
                          groups[r.emoji].users.push(r.member_name);
                          if (r.member === currentMemberId) {
                            groups[r.emoji].userReacted = true;
                          }
                        });
                        return groups;
                      })();
                      
                      return (
                        <React.Fragment key={m.id}>
                          {showDateSeparator && (
                            <div className="flex justify-center my-4 w-full sticky top-0 z-20">
                              <span className="bg-sand/90 backdrop-blur-xs text-[10px] text-warm-muted font-bold px-3 py-1 rounded-full shadow-xs border border-warm/20">
                                {formatDateSeparator(m.created_at)}
                              </span>
                            </div>
                          )}
                          <motion.div
                            id={`msg-${m.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className={`flex items-end gap-2 w-full group relative transition-all duration-300 ${
                              isOwn ? "justify-end" : "justify-start"
                            } ${
                              isConsecutive ? "mt-2" : index === 0 ? "mt-0" : "mt-4"
                            }`}
                          >
                            {!isOwn && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProfile(m.sender);
                                }}
                                className={`w-8 h-8 rounded-full bg-sand flex items-center justify-center overflow-hidden border border-warm/30 shrink-0 cursor-pointer hover:border-primary/50 transition-all ${
                                  isConsecutive ? "opacity-0 pointer-events-none w-0 h-0 mr-0" : "mr-1"
                                }`}
                              >
                                {m.sender_photo ? (
                                  <img src={getImageUrl(m.sender_photo)} alt={m.sender_name} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-warm-muted" />
                                )}
                              </div>
                            )}

                            {/* If outgoing, show desktop inline timestamp first (on the left of bubble) */}
                            {isOwn && (
                              <div className={`hidden md:flex items-center text-[10px] text-slate-400 font-bold transition-all duration-200 select-none mr-2 shrink-0 ${
                                selectedMessageId === m.id || activeReactionPickerId === m.id
                                  ? "opacity-100 scale-100"
                                  : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                              }`}>
                                <span>{new Date(m.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="flex items-center ml-1">
                                  {m.is_seen ? (
                                    <span className="text-sky-500 font-extrabold flex">✓✓</span>
                                  ) : (
                                    <span className="text-slate-400 flex">✓✓</span>
                                  )}
                                </span>
                              </div>
                            )}

                            <div className={`max-w-[85%] md:max-w-[75%] lg:max-w-[65%] flex flex-col relative ${isOwn ? "items-end" : "items-start"}`}>
                              {/* Mobile inline active reaction picker */}
                              <AnimatePresence>
                                {activeReactionPickerId === m.id && (
                                  <motion.div
                                    id={`reaction-picker-${m.id}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className={`absolute -top-11 z-30 bg-white border border-warm px-2 py-1.5 rounded-full shadow-lg flex gap-1.5 ${
                                      isOwn ? "right-2" : "left-2"
                                    }`}
                                  >
                                    {popularEmojis.map(emo => (
                                      <button
                                        key={emo}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReactToggle(m.id, emo);
                                          setActiveReactionPickerId(null);
                                        }}
                                        className="hover:scale-130 transition text-base px-1 active:scale-95"
                                      >
                                        {emo}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selectedMessageId === m.id) {
                                    setSelectedMessageId(null);
                                    setActiveReactionPickerId(null);
                                  } else {
                                    setSelectedMessageId(m.id);
                                    setActiveReactionPickerId(m.id);
                                    
                                    // Auto-hide timestamp on mobile after 4 seconds
                                    if (window.innerWidth < 768) {
                                      setTimeout(() => {
                                        setSelectedMessageId(prev => prev === m.id ? null : prev);
                                        setActiveReactionPickerId(prev => prev === m.id ? null : prev);
                                      }, 4000);
                                    }
                                  }
                                }}
                                className={`relative p-3 rounded-2xl text-xs leading-relaxed shadow-xs w-fit max-w-full cursor-pointer transition-all ${
                                  isHighlighted ? "ring-2 ring-primary bg-primary/15 text-slate-800" : ""
                                } ${
                                  isOwn
                                    ? "bg-primary text-white rounded-br-none"
                                    : "bg-white border border-warm text-slate-800 rounded-bl-none"
                                }`}
                                style={{
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {/* Reply Context card inside bubble */}
                                {m.reply_to_details && (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      scrollToMessage(m.reply_to_details!.id);
                                    }}
                                    className={`border-l-4 p-1.5 px-2.5 mb-2 rounded-lg text-[10px] cursor-pointer hover:bg-black/5 transition text-left ${
                                      isOwn ? "border-white/60 bg-white/10 text-white" : "border-primary bg-sand/40 text-slate-700"
                                    }`}
                                  >
                                    <div className="flex gap-1.5 items-center justify-between">
                                      <span className="font-extrabold opacity-95">
                                        {m.reply_to_details.sender === currentMemberId ? "You" : m.reply_to_details.sender_name}
                                      </span>
                                      {m.reply_to_details.image && (
                                        <img 
                                          src={getImageUrl(m.reply_to_details.image)} 
                                          alt="Thumbnail" 
                                          className="w-5 h-5 object-cover rounded border border-warm/20 flex-shrink-0" 
                                        />
                                      )}
                                    </div>
                                    <p className="truncate opacity-80 mt-0.5">{m.reply_to_details.content || "📷 Image"}</p>
                                  </div>
                                )}

                                {m.content && <p>{m.content}</p>}
                                
                                {/* Custom Voice Message Audio Player layout */}
                                {m.file === "audio_mock.mp3" ? (
                                  <div className={`flex items-center gap-3 p-2.5 rounded-xl border mt-2 ${
                                    isOwn ? "bg-white/10 border-white/20 text-white" : "bg-sand/20 border-warm text-slate-800"
                                  }`}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        alert("Playing voice message...");
                                      }}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                        isOwn ? "bg-white text-primary" : "bg-primary text-white"
                                      }`}
                                    >
                                      ▶
                                    </button>
                                    <div className="flex-1">
                                      <div className={`h-1 rounded w-full ${isOwn ? "bg-white/20" : "bg-slate-200"}`}>
                                        <div className={`h-1 rounded w-1/3 ${isOwn ? "bg-white" : "bg-primary"}`} />
                                      </div>
                                      <div className="flex justify-between text-[8px] mt-1 font-bold opacity-75">
                                        <span>0:12</span>
                                        <span>0:40</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {m.image && (
                                      <div className="mt-2 rounded-lg overflow-hidden max-w-xs border border-warm/30 cursor-pointer" onClick={(e) => { e.stopPropagation(); setLightboxImage(getImageUrl(m.image)); }}>
                                        <img src={getImageUrl(m.image)} alt="Attachment" className="w-full h-auto object-cover max-h-48" loading="lazy" />
                                      </div>
                                    )}

                                    {m.file && (
                                      <div className="mt-2 flex items-center gap-2 p-2 bg-black/5 rounded-lg text-[10px] font-bold">
                                        <FileText className="w-4 h-4" />
                                        <a href={getImageUrl(m.file)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:underline truncate max-w-[150px]">
                                          View Document
                                        </a>
                                      </div>
                                    )}
                                  </>
                                )}

                                {/* Render reactions on bottom corner */}
                                {Object.entries(reactionGroups).length > 0 && (
                                  <div className="absolute -bottom-2.5 right-2 flex items-center gap-1 bg-white border border-warm rounded-full px-1.5 py-0.5 shadow-xs z-10 select-none">
                                    {Object.entries(reactionGroups).map(([emoji, group]) => (
                                      <motion.span
                                        key={emoji}
                                        title={group.users.join(", ")}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReactToggle(m.id, emoji);
                                        }}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        className={`cursor-pointer flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-full transition-all duration-200 ${
                                          group.userReacted ? "bg-primary/15 text-primary font-extrabold border border-primary/20" : "bg-slate-100 text-slate-600 border border-warm"
                                        }`}
                                      >
                                        <span>{emoji}</span>
                                        {group.count > 1 && <span className="text-[8px] font-bold">{group.count}</span>}
                                      </motion.span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Timestamp below the bubble (Outside - Mobile Only) */}
                              <div className={`text-[9px] font-bold text-warm-muted select-none mt-1 transition-all duration-200 md:hidden ${
                                selectedMessageId === m.id 
                                  ? "flex" 
                                  : "hidden"
                              } ${isOwn ? "justify-end text-right" : "justify-start text-left"}`}>
                                <span>{new Date(m.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                {isOwn && (
                                  <span className="flex items-center ml-1">
                                    {m.is_seen ? (
                                      <span className="text-sky-500 font-extrabold flex">✓✓</span>
                                    ) : (
                                      <span className="text-slate-400 flex">✓✓</span>
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Actions bar for Reply, React, Delete (appears below bubble on interaction) */}
                              {selectedMessageId === m.id && (
                                <div className={`flex items-center gap-2 mt-1 text-[10px] font-bold z-10 ${
                                  isOwn ? "justify-end" : "justify-start"
                                }`}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveReactionPickerId(activeReactionPickerId === m.id ? null : m.id);
                                    }}
                                    className="px-2 py-1 rounded-md bg-sand hover:bg-sand/80 text-slate-700 border border-warm/40 transition active:scale-95 flex items-center gap-1"
                                  >
                                    😊 React
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReplyingToMessage(m);
                                      setSelectedMessageId(null);
                                      setActiveReactionPickerId(null);
                                    }}
                                    className="px-2 py-1 rounded-md bg-sand hover:bg-sand/80 text-slate-700 border border-warm/40 transition active:scale-95 flex items-center gap-1"
                                  >
                                    ↪️ Reply
                                  </button>
                                  {isOwn && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMessage(m.id);
                                        setSelectedMessageId(null);
                                        setActiveReactionPickerId(null);
                                      }}
                                      className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition active:scale-95 flex items-center gap-1"
                                    >
                                      🗑️ Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* If incoming, show desktop inline timestamp last (on the right of bubble) */}
                            {!isOwn && (
                              <div className={`hidden md:flex items-center text-[10px] text-slate-400 font-bold transition-all duration-200 select-none ml-2 shrink-0 ${
                                selectedMessageId === m.id || activeReactionPickerId === m.id
                                  ? "opacity-100 scale-100"
                                  : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                              }`}>
                                <span>{new Date(m.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                          </motion.div>
                        </React.Fragment>
                      );
                    });
                  })()
                )}

                {/* typing indicator simulation block */}
                {isTyping && (
                  <div className="flex items-center gap-2 mr-auto max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center overflow-hidden border border-warm/30 shrink-0">
                      <User className="w-4 h-4 text-warm-muted" />
                    </div>
                    <div className="bg-white border border-warm p-3 rounded-2xl rounded-bl-none shadow-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-warm-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-warm-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-warm-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Message Input Composer (Sticky Bottom) */}
              <div className="bg-white border-t border-warm p-3 z-10 flex-shrink-0">
                {/* Replying Context Bar */}
                <AnimatePresence>
                  {replyingToMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: 10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 10 }}
                      transition={{ duration: 0.18 }}
                      className="bg-sand/30 border-l-4 border-primary p-2 px-3 flex items-center justify-between text-xs rounded-t-xl mb-2 overflow-hidden"
                    >
                      <div className="truncate flex-1">
                        <p className="font-bold text-primary">Replying to {replyingToMessage.sender === currentMemberId ? "You" : replyingToMessage.sender_name}</p>
                        <p className="text-warm-muted truncate text-[11px]">
                          {replyingToMessage.content ? replyingToMessage.content.split('\n')[0] : (replyingToMessage.image ? "📷 Image" : "📁 Attachment")}
                        </p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setReplyingToMessage(null)}
                        className="text-warm-muted hover:text-foreground font-black text-sm ml-2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/5"
                      >
                        ×
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload Previews */}
                {(selectedImage || selectedFile) && (
                  <div className="flex items-center gap-2 p-2 bg-sand/30 border border-warm/40 rounded-xl text-xs mb-2">
                    {selectedImage ? (
                      <>
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <span className="truncate flex-1 font-semibold">Image: {selectedImage.name}</span>
                        {imagePreview && <img src={imagePreview} className="w-8 h-8 object-cover rounded-md border" />}
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-teal" />
                        <span className="truncate flex-1 font-semibold">File: {selectedFile?.name}</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => { setSelectedImage(null); setSelectedFile(null); setImagePreview(null); }}
                      className="text-rose-500 font-extrabold text-sm px-1.5"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Quick Emoji selection scrollbar */}
                {showEmojiPicker && (
                  <div className="flex items-center gap-2 p-2 border-b border-warm/50 overflow-x-auto mb-2 scrollbar-none">
                    {popularEmojis.map(emo => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => {
                          setNewMessageText(prev => prev + emo);
                          setShowEmojiPicker(false);
                        }}
                        className="text-base p-1 hover:bg-sand/50 rounded-lg transition"
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Control Row */}
                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2.5 bg-sand/40 hover:bg-sand/70 rounded-xl border border-warm/60 transition flex-shrink-0"
                    title="Upload Image"
                  >
                    <ImageIcon className="w-4 h-4 text-warm-muted" />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 bg-sand/40 hover:bg-sand/70 rounded-xl border border-warm/60 transition flex-shrink-0"
                    title="Upload Document"
                  >
                    <Paperclip className="w-4 h-4 text-warm-muted" />
                  </button>

                  {/* Emoji toggle button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2.5 bg-sand/40 hover:bg-sand/70 rounded-xl border border-warm/60 transition flex-shrink-0 ${showEmojiPicker ? "text-primary border-primary bg-primary/5" : ""}`}
                    title="Insert Emoji"
                  >
                    <Heart className="w-4 h-4 text-warm-muted" />
                  </button>

                  {/* Voice Message recorder interface */}
                  {isRecording ? (
                    <div className="flex-1 bg-rose-50 border border-rose-200 rounded-xl p-1.5 px-3 flex items-center justify-between gap-3 animate-pulse">
                      <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                        <span>Recording Voice...</span>
                        <span className="font-extrabold bg-rose-200/50 px-2 py-0.5 rounded text-[10px]">
                          {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => stopRecording(false)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 text-[10px] font-black"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => stopRecording(true)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-black"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Auto Expanding Textarea */}
                      <textarea
                        rows={1}
                        placeholder="Type a message..."
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        className="flex-1 px-4 py-2.5 border border-warm rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-hidden max-h-24 resize-none overflow-y-auto"
                      />

                      {/* Voice Recording trigger */}
                      <button
                        type="button"
                        onClick={startRecording}
                        className="p-2.5 bg-sand/40 hover:bg-sand/70 rounded-xl border border-warm/60 transition flex-shrink-0"
                        title="Record Voice"
                      >
                        <Users className="w-4 h-4 text-warm-muted" />
                      </button>

                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={sendingMessage || (!newMessageText.trim() && !selectedImage && !selectedFile)}
                        className="p-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : selectedRequest ? (
            /* Request Review Workspace */
            <div className="p-6 overflow-y-auto h-full flex flex-col justify-between">
              {/* Back Button for mobile */}
              <div className="md:hidden flex items-center mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setMobileActiveView("list");
                    setSelectedRequest(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-warm bg-white text-xs font-bold text-warm-muted"
                >
                  ← Back to Inbox
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-white border border-warm rounded-2xl shadow-xs">
                  <div className="w-20 h-20 rounded-2xl bg-sand flex items-center justify-center overflow-hidden border border-warm/40 flex-shrink-0">
                    {selectedRequest.sender_photo ? (
                      <img src={getImageUrl(selectedRequest.sender_photo)} alt={selectedRequest.sender_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-warm-muted" />
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20 inline-block mb-1.5">
                      {selectedRequest.reason}
                    </span>
                    <h3 className="font-extrabold text-lg text-foreground">{selectedRequest.sender_name}</h3>
                    
                    <div className="mt-2 space-y-1 text-xs text-warm-muted font-bold">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-teal shrink-0" />
                        <span>{selectedRequest.sender_profession || "Samaj Member"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span>{selectedRequest.sender_village || "Gujarat"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-warm-muted shrink-0" />
                        <span>{selectedRequest.sender_community_name || "Local Samaj"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Subject</h4>
                  <div className="p-4 bg-white border border-warm rounded-2xl text-xs font-extrabold text-foreground">
                    {selectedRequest.subject || "No Subject Provided"}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Introduction Message</h4>
                  <div className="p-4 bg-white border border-warm rounded-2xl text-xs text-foreground/80 leading-relaxed">
                    {selectedRequest.introduction_message}
                  </div>
                </div>
              </div>

              {selectedRequest.receiver === currentMemberId && selectedRequest.status === "pending" && (
                <div className="mt-6 pt-4 border-t border-warm grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleViewProfile(selectedRequest.sender)}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> View Full Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={actionLoading}
                    className="py-2.5 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Decline Request
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={actionLoading}
                    className="py-2.5 px-4 rounded-xl bg-teal hover:bg-teal-dark text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Request
                  </button>
                </div>
              )}

              {selectedRequest.sender === currentMemberId && (
                <div className="mt-6 p-4 bg-sand/30 border border-warm/50 rounded-2xl text-center text-xs font-bold text-warm-muted">
                  <Clock className="w-4 h-4 mx-auto mb-1.5 text-warm-muted opacity-80" />
                  Your connection request is pending recipient's approval.
                </div>
              )}
            </div>
          ) : (
            /* Empty Landing View Screen */
            <div className="flex flex-col items-center justify-center h-full text-warm-muted p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sand/50 text-warm-muted/70 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">Your Inbox</h3>
              <p className="text-xs text-warm-muted mt-1 max-w-sm leading-relaxed">
                Select a conversation or pending connection request from the left list to review detail profiles or start messaging.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── AUDIO / VIDEO CALL SIMULATOR BACKDROP OVERLAY SCREEN ─── */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/95 z-60 flex flex-col items-center justify-center p-6 text-white"
          >
            {activeCall.type === "video" ? (
              /* Video Call mockup screen */
              <div className="w-full max-w-4xl flex flex-col h-[80vh] justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Remote participant webcam stream */}
                  <div className="relative aspect-video bg-slate-800 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center shadow-lg">
                    {activeCall.partner.photo ? (
                      <img src={getImageUrl(activeCall.partner.photo)} alt="Webcam" className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <User className="w-16 h-16 text-slate-600" />
                    )}
                    <span className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold">
                      {activeCall.partner.name}
                    </span>
                  </div>

                  {/* Local participant webcam stream (mock) */}
                  <div className="relative aspect-video bg-slate-800 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-slate-900 flex items-center justify-center">
                      <User className="w-16 h-16 text-slate-700 animate-pulse" />
                    </div>
                    <span className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold">
                      You (My Camera)
                    </span>
                    <span className="absolute top-4 right-4 bg-teal px-2.5 py-0.5 rounded text-[10px] font-black uppercase">
                      Live
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-sm font-extrabold text-slate-300">Video Call connected</p>
                    <p className="text-xs font-mono tracking-widest mt-1 text-teal">
                      {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={endCall}
                    className="w-14 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
                    title="End Call"
                  >
                    <XCircle className="w-7 h-7" />
                  </button>
                </div>
              </div>
            ) : (
              /* Audio Call mockup screen */
              <div className="flex flex-col items-center justify-between h-[60vh] max-w-sm w-full">
                <div className="flex flex-col items-center mt-12">
                  <div className="relative">
                    <span className="absolute inset-0 rounded-full bg-teal/20 animate-ping scale-150" />
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-800 border-4 border-slate-700 relative z-10 flex items-center justify-center">
                      {activeCall.partner.photo ? (
                        <img src={getImageUrl(activeCall.partner.photo)} alt={activeCall.partner.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-slate-500" />
                      )}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-lg mt-6">{activeCall.partner.name}</h3>
                  <p className="text-xs text-slate-400 mt-2">Calling...</p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <p className="text-xs font-mono tracking-widest text-teal">
                    {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
                  </p>
                  <button
                    type="button"
                    onClick={endCall}
                    className="w-14 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
                    title="End Call"
                  >
                    <XCircle className="w-7 h-7" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MEMBER PROFILE SLIDE-OVER SIDEBAR (DRAWER) ─── */}
      {showProfileDrawer && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity" 
          onClick={() => { if (!drawerLoading) setShowProfileDrawer(false); }} 
        />
      )}

      <AnimatePresence>
        {showProfileDrawer && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 h-full bg-white z-55 shadow-2xl flex flex-col w-full sm:w-[80%] md:w-[480px] lg:w-[500px]"
          >
            {/* Sticky Header */}
            <div className="p-4 border-b border-warm flex items-center justify-between bg-sand/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-sm text-foreground">Member Profile</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-white uppercase tracking-wider">
                  Details
                </span>
              </div>
              <button
                onClick={() => setShowProfileDrawer(false)}
                className="p-1 rounded-full hover:bg-sand text-warm-muted hover:text-foreground font-black text-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {drawerLoading ? (
                /* Skeleton Loader */
                <div className="space-y-6 animate-pulse">
                  <div className="flex items-center gap-4 bg-sand/5 p-4 rounded-2xl border border-warm/50">
                    <div className="w-20 h-20 bg-sand/60 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-sand/80 rounded-md w-3/4" />
                      <div className="h-3 bg-sand/50 rounded-md w-1/2" />
                      <div className="h-3 bg-sand/40 rounded-md w-2/3" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-sand/60 rounded-md w-1/4" />
                    <div className="h-20 bg-sand/30 rounded-2xl border border-warm/40" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-sand/40 rounded-2xl border border-warm/30" />
                    <div className="h-16 bg-sand/40 rounded-2xl border border-warm/30" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-sand/60 rounded-md w-1/3" />
                    <div className="h-32 bg-sand/20 rounded-2xl border border-warm/40" />
                  </div>
                </div>
              ) : drawerMember ? (
                <>
                  {/* Profile Card Header */}
                  <div className="relative rounded-2xl border border-warm bg-gradient-to-b from-sand/15 to-transparent p-5 flex flex-col items-center text-center shadow-xs">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md bg-sand flex items-center justify-center">
                      {drawerMember.photo ? (
                        <img 
                          src={getImageUrl(drawerMember.photo)} 
                          alt={drawerMember.name} 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                        />
                      ) : (
                        <User className="w-12 h-12 text-warm-muted" />
                      )}
                      {/* Active Status indicator */}
                      <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Active Now" />
                    </div>

                    <h2 className="text-base font-black text-foreground mt-3 flex items-center gap-1.5 leading-tight">
                      {drawerMember.name}
                      {(drawerMember.aadhaar_status === "Approved" || drawerMember.status === "Verified") && (
                        <CheckCircle2 className="w-4 h-4 text-teal fill-teal/15 shrink-0" />
                      )}
                    </h2>
                    <p className="text-xs text-warm-muted font-bold mt-1">
                      {drawerMember.profession || drawerMember.job_title || "Community Member"}
                    </p>
                    <p className="text-[10px] text-warm-muted font-semibold mt-0.5">
                      📍 {drawerMember.village || "Gujarat"} • {drawerMember.community_name || drawerMember.community?.name || "Local Samaj"}
                    </p>
                  </div>

                  {/* Statistics Section */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Member Statistics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-sand/10 border border-warm/60 rounded-2xl p-3 flex items-center gap-3">
                        <Users className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-warm-muted">Connections</p>
                          <p className="text-xs font-extrabold text-foreground">{drawerMember.connections_count || 12}</p>
                        </div>
                      </div>
                      <div className="bg-sand/10 border border-warm/60 rounded-2xl p-3 flex items-center gap-3">
                        <Building className="w-4 h-4 text-teal shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-warm-muted">Businesses</p>
                          <p className="text-xs font-extrabold text-foreground">{drawerMember.businesses_count || (drawerMember.profession_type === "Business" ? 1 : 0)}</p>
                        </div>
                      </div>
                      <div className="bg-sand/10 border border-warm/60 rounded-2xl p-3 flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gold shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-warm-muted">Events Attended</p>
                          <p className="text-xs font-extrabold text-foreground">{drawerMember.events_count || 4}</p>
                        </div>
                      </div>
                      <div className="bg-sand/10 border border-warm/60 rounded-2xl p-3 flex items-center gap-3">
                        <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-warm-muted">Donations Made</p>
                          <p className="text-xs font-extrabold text-foreground">{drawerMember.donations_count || "₹2,500"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* About Section */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">About Member</h4>
                    <div className="p-4 bg-sand/10 border border-warm rounded-2xl text-xs text-foreground/80 leading-relaxed">
                      {drawerMember.bio || drawerMember.about_me || "This member has not written a bio yet."}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Personal Information</h4>
                    <div className="bg-white border border-warm rounded-2xl divide-y divide-warm/40 overflow-hidden text-xs">
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Gender</span>
                        <span className="font-bold text-foreground">{drawerMember.gender || "Not specified"}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Date of Birth</span>
                        <span className="font-bold text-foreground">
                          {drawerMember.dob || drawerMember.date_of_birth || "Not specified"}
                        </span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Age</span>
                        <span className="font-bold text-foreground">
                          {drawerMember.age || (drawerMember.dob ? new Date().getFullYear() - new Date(drawerMember.dob).getFullYear() : "Not specified")} years
                        </span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Marital Status</span>
                        <span className="font-bold text-foreground">{drawerMember.marital_status || "Not specified"}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Mobile Number</span>
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-warm-muted" />
                          {drawerMember.phone || "Hidden"}
                        </span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Email Address</span>
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-warm-muted" />
                          {drawerMember.email || "Hidden"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Location details</h4>
                    <div className="bg-white border border-warm rounded-2xl divide-y divide-warm/40 overflow-hidden text-xs">
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Village</span>
                        <span className="font-bold text-foreground">{drawerMember.village || "Not specified"}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">City</span>
                        <span className="font-bold text-foreground">{drawerMember.city || "Not specified"}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">State</span>
                        <span className="font-bold text-foreground">{drawerMember.state || "Not specified"}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Country</span>
                        <span className="font-bold text-foreground">{drawerMember.country || "India"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Details */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Professional details</h4>
                    <div className="bg-white border border-warm rounded-2xl divide-y divide-warm/40 overflow-hidden text-xs">
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Occupation</span>
                        <span className="font-bold text-foreground">{drawerMember.profession || drawerMember.job_title || "Not specified"}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Company Name</span>
                        <span className="font-bold text-foreground">{drawerMember.business_name || drawerMember.company || "Not specified"}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Education</span>
                        <span className="font-bold text-foreground">{drawerMember.education || "Not specified"}</span>
                      </div>
                      <div className="p-3">
                        <span className="font-semibold text-warm-muted block mb-2">Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {drawerMember.skills ? (
                            typeof drawerMember.skills === "string" ? (
                              drawerMember.skills.split(",").map((s: string) => (
                                <span key={s} className="px-2 py-1 rounded bg-sand/40 border border-warm text-[10px] font-bold text-slate-800">
                                  {s.trim()}
                                </span>
                              ))
                            ) : (
                              Array.isArray(drawerMember.skills) ? (
                                drawerMember.skills.map((s: any) => (
                                  <span key={s} className="px-2 py-1 rounded bg-sand/40 border border-warm text-[10px] font-bold text-slate-800">
                                    {s}
                                  </span>
                                ))
                              ) : null
                            )
                          ) : (
                            <span className="text-warm-muted font-bold">No skills added</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Community & Hierarchy Information */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Community Details</h4>
                    <div className="bg-white border border-warm rounded-2xl divide-y divide-warm/40 overflow-hidden text-xs">
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Community Name</span>
                        <span className="font-bold text-foreground">{drawerMember.community_name || drawerMember.community?.name || "Local Samaj"}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Parent Community</span>
                        <span className="font-bold text-foreground">{drawerMember.parent_community_name || "Platform Ancestor"}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Member Since</span>
                        <span className="font-bold text-foreground">
                          {drawerMember.created_at ? new Date(drawerMember.created_at).toLocaleDateString() : "2026"}
                        </span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Committee Position</span>
                        <span className="font-bold text-foreground">
                          {drawerMember.role === "community_admin" || drawerMember.role === "committee" ? "Committee Member" : "Active Member"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Family Information */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Family Details</h4>
                    <div className="bg-white border border-warm rounded-2xl divide-y divide-warm/40 overflow-hidden text-xs">
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Family Head</span>
                        <span className="font-bold text-foreground">
                          {drawerMember.family_head || (drawerMember.is_family_head ? "Self" : "Yes")}
                        </span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="font-semibold text-warm-muted">Family Members Count</span>
                        <span className="font-bold text-foreground">{drawerMember.family_members_count || 4} Members</span>
                      </div>
                    </div>
                  </div>

                  {/* Photo Gallery */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Photo Gallery</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {drawerMember.photo && (
                        <div 
                          className="aspect-square rounded-xl overflow-hidden border border-warm cursor-pointer hover:opacity-90 transition relative"
                          onClick={() => setLightboxImage(getImageUrl(drawerMember.photo))}
                        >
                          <img src={getImageUrl(drawerMember.photo)} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
                          <span className="absolute bottom-1 right-1 bg-black/50 text-[8px] text-white px-1 py-0.5 rounded font-black">
                            Profile
                          </span>
                        </div>
                      )}
                      {/* Additional mock portfolio images for premium aesthetic */}
                      {[
                        { id: 1, color: "from-teal/40 to-emerald/20", text: "Social Event" },
                        { id: 2, color: "from-amber/40 to-orange/20", text: "Samaj Gathering" }
                      ].map(img => (
                        <div 
                          key={img.id}
                          className="aspect-square rounded-xl overflow-hidden border border-warm flex flex-col justify-end p-2 bg-gradient-to-br from-sand to-sand/40 relative cursor-pointer hover:opacity-90 transition"
                          onClick={() => setLightboxImage(getImageUrl(drawerMember.photo) || "")}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${img.color} opacity-60`} />
                          <span className="relative z-10 text-[8px] font-black text-slate-800 uppercase tracking-wider">
                            {img.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-warm-muted text-xs">Failed to load member profile details.</div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-warm bg-sand/15 flex items-center justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowProfileDrawer(false)}
                className="py-2 px-4 rounded-xl border border-warm hover:bg-sand text-xs font-bold text-warm-muted transition"
              >
                Close
              </button>

              {/* Connected Status toggle button */}
              <button
                type="button"
                onClick={() => alert("Simulated: You have requested to connect with this member.")}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1"
              >
                <Heart className="w-3.5 h-3.5 fill-current" /> Connect
              </button>

              {/* Request specific actions */}
              {selectedRequest && selectedRequest.receiver === currentMemberId && selectedRequest.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => { handleReject(selectedRequest.id); setShowProfileDrawer(false); }}
                    disabled={actionLoading}
                    className="py-2 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleApprove(selectedRequest.id); setShowProfileDrawer(false); }}
                    disabled={actionLoading}
                    className="py-2 px-4 rounded-xl bg-teal hover:bg-teal-dark text-white text-xs font-bold transition"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PHOTO GALLERY LIGHTBOX ─── */}
      <AnimatePresence>
        {lightboxImage && (
          <div 
            className="fixed inset-0 bg-black/95 z-60 flex items-center justify-center p-4 transition-opacity"
            onClick={() => setLightboxImage(null)}
          >
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 text-white hover:text-slate-300 font-extrabold text-3xl p-2 bg-black/40 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              src={lightboxImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
