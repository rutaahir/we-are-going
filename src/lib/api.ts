import { 
  COMMUNITIES, MEMBERS, EVENTS, JOBS, BUSINESSES, 
  MATRIMONY, DONATIONS, CAMPAIGNS, NEWS, COMMITTEE, FAMILIES 
} from "@/data/mock";

const API_BASE = "http://localhost:8000/api";

// Helper to handle fetch with optional authorization
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("wag_token") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.statusText}`;
      let errorFields: any = null;
      try {
        const errorData = await response.json();
        if (errorData) {
          errorFields = errorData;
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (typeof errorData === 'object') {
            errorMessage = Object.entries(errorData)
              .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
              .join('; ');
          }
        }
      } catch (e) {
        // Keep statusText fallback
      }
      const err = new Error(errorMessage) as any;
      err.status = response.status;
      err.errorFields = errorFields;
      throw err;
    }

    // Handle 204 No Content (e.g. DELETE responses) — no body to parse
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as unknown as T;
    }

    return response.json();
  } catch (error) {
    console.error("API fetch error:", error);
    throw error;
  }
}

export const api = {
  // Authentication
  async login(username: string, password: string) {
    try {
      const res = await apiFetch<{ access: string; refresh: string; user: any; member?: any }>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (res.access) {
        localStorage.setItem("wag_token", res.access);
        localStorage.setItem("wag_refresh", res.refresh);
      }
      return {
        ...res.user,
        role: res.member?.role || "member",
        communityName: res.member?.community_id ? "Samaj" : "Platform",
        communityId: res.member?.community_id
      };
    } catch (e) {
      console.error("Login failed", e);
      throw e;
    }
  },

  async register(data: any) {
    try {
      return await apiFetch<any>("/auth/register/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Registration failed", e);
      throw e;
    }
  },

  async getCurrentUser() {
    try {
      return await apiFetch<any>("/auth/me/");
    } catch (e) {
      console.warn("Failed to get current user", e);
      return null;
    }
  },

  // Communities
  async getCommunities(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/communities/?${query}` : "/communities/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Django API failed, falling back to mock COMMUNITIES", e);
      return COMMUNITIES;
    }
  },

  async getCommunity(id: string): Promise<any> {
    try {
      return await apiFetch<any>(`/communities/${id}/`);
    } catch (e) {
      console.warn(`Failed to get community ${id}`, e);
      return COMMUNITIES.find((c: any) => c.id === parseInt(id));
    }
  },

  async createCommunity(data: any): Promise<any> {
    try {
      return await apiFetch<any>("/communities/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Failed to create community", e);
      throw e;
    }
  },

  async getCommunityStats(communityId: string): Promise<any> {
    try {
      return await apiFetch<any>(`/communities/${communityId}/statistics/`);
    } catch (e) {
      console.warn(`Failed to get community stats`, e);
      return { members_count: 0, events_count: 0 };
    }
  },

  async approveCommunity(id: string, remarks?: string): Promise<any> {
    return await apiFetch<any>(`/communities/${id}/approve/`, {
      method: "POST",
      body: JSON.stringify({ remarks: remarks || "Approved." })
    });
  },

  async rejectCommunity(id: string, remarks: string): Promise<any> {
    return await apiFetch<any>(`/communities/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ remarks })
    });
  },

  async getApprovalHistory(): Promise<any[]> {
    try {
      return await apiFetch<any[]>("/approval-history/");
    } catch (e) {
      console.warn("Failed to get approval history", e);
      return [];
    }
  },

  async getNotifications(): Promise<any[]> {
    try {
      return await apiFetch<any[]>("/notifications/");
    } catch (e) {
      console.warn("Failed to get notifications", e);
      return [];
    }
  },

  async markAllNotificationsRead(): Promise<any> {
    try {
      return await apiFetch<any>("/notifications/mark_all_as_read/", {
        method: "POST"
      });
    } catch (e) {
      console.warn("Failed to mark notifications read", e);
    }
  },

  // Events
  async getEvents(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/events/?${query}` : "/events/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Django API failed, falling back to mock EVENTS", e);
      return EVENTS;
    }
  },

  async getEvent(id: string): Promise<any> {
    try {
      return await apiFetch<any>(`/events/${id}/`);
    } catch (e) {
      console.warn(`Failed to get event ${id}`, e);
      return EVENTS.find((e: any) => e.id === parseInt(id));
    }
  },

  async getUpcomingEvents(): Promise<any[]> {
    try {
      return await apiFetch<any[]>("/events/upcoming/");
    } catch (e) {
      console.warn("Failed to get upcoming events", e);
      return EVENTS.filter((e: any) => e.upcoming);
    }
  },

  async createEvent(data: any): Promise<any> {
    try {
      return await apiFetch<any>("/events/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Failed to create event", e);
      throw e;
    }
  },

  async updateEvent(id: string | number, data: any): Promise<any> {
    try {
      return await apiFetch<any>(`/events/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Failed to update event", e);
      throw e;
    }
  },

  // Event Registrations
  async getEventRegistrations(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/event-registrations/?${query}` : "/event-registrations/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Failed to get event registrations", e);
      return [];
    }
  },

  async createEventRegistration(data: any): Promise<any> {
    try {
      return await apiFetch<any>("/event-registrations/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Failed to create event registration", e);
      throw e;
    }
  },

  // Jobs
  async getJobs(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/jobs/?${query}` : "/jobs/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Django API failed, falling back to mock JOBS", e);
      return JOBS;
    }
  },

  async getJob(id: string): Promise<any> {
    try {
      return await apiFetch<any>(`/jobs/${id}/`);
    } catch (e) {
      console.warn(`Failed to get job ${id}`, e);
      return JOBS.find((j: any) => j.id === parseInt(id));
    }
  },

  async createJob(data: any): Promise<any> {
    try {
      return await apiFetch<any>("/jobs/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Failed to create job", e);
      throw e;
    }
  },

  // Businesses
  async getBusinesses(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/businesses/?${query}` : "/businesses/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Django API failed, falling back to mock BUSINESSES", e);
      return BUSINESSES;
    }
  },

  async getBusiness(id: string): Promise<any> {
    try {
      return await apiFetch<any>(`/businesses/${id}/`);
    } catch (e) {
      console.warn(`Failed to get business ${id}`, e);
      return BUSINESSES.find((b: any) => b.id === parseInt(id));
    }
  },

  async createBusiness(data: any): Promise<any> {
    try {
      return await apiFetch<any>("/businesses/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Failed to create business", e);
      throw e;
    }
  },

  // Matrimony
  async getMatrimonyProfiles(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/matrimony/?${query}` : "/matrimony/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Django API failed, falling back to mock MATRIMONY", e);
      return MATRIMONY;
    }
  },

  async getMatrimony(filters?: any): Promise<any[]> {
    return this.getMatrimonyProfiles(filters);
  },

  async getMatrimonyProfile(id: string): Promise<any> {
    try {
      return await apiFetch<any>(`/matrimony/${id}/`);
    } catch (e) {
      console.warn(`Failed to get matrimony profile ${id}`, e);
      return MATRIMONY.find((m: any) => m.id === parseInt(id));
    }
  },

  // News
  async getNews(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/news/?${query}` : "/news/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Django API failed, falling back to mock NEWS", e);
      return NEWS;
    }
  },

  async getNewsArticle(id: string): Promise<any> {
    try {
      return await apiFetch<any>(`/news/${id}/`);
    } catch (e) {
      console.warn(`Failed to get news ${id}`, e);
      return NEWS.find((n: any) => n.id === parseInt(id));
    }
  },

  // Donations
  async getDonations(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/donations/?${query}` : "/donations/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Django API failed, falling back to mock DONATIONS", e);
      return DONATIONS;
    }
  },

  async createDonation(data: any): Promise<any> {
    try {
      return await apiFetch<any>("/donations/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Failed to create donation", e);
      throw e;
    }
  },

  // Campaigns
  async getCampaigns(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/campaigns/?${query}` : "/campaigns/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Django API failed, falling back to mock CAMPAIGNS", e);
      return CAMPAIGNS;
    }
  },

  // Members
  async getMembers(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/members/?${query}` : "/members/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Django API failed, falling back to mock MEMBERS", e);
      return MEMBERS;
    }
  },

  async updateMember(memberId: string, data: any): Promise<any> {
    try {
      return await apiFetch<any>(`/members/${memberId}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error(`Failed to update member for ${memberId}`, e);
      throw e;
    }
  },

  async updateMemberStatus(memberId: string, status: string): Promise<any> {
    return this.updateMember(memberId, { status });
  },

  // Families
  async getFamilies(communityId?: string): Promise<any[]> {
    try {
      const q = communityId ? `?communityId=${communityId}` : "";
      return await apiFetch<any[]>(`/families/${q}`);
    } catch (e) {
      console.warn("Django API failed, falling back to mock FAMILIES", e);
      return FAMILIES;
    }
  },

  // Committee
  async getCommittee(filters?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(filters || {}).toString();
      const endpoint = query ? `/committee/?${query}` : "/committee/";
      return await apiFetch<any[]>(endpoint);
    } catch (e) {
      console.warn("Django API failed, falling back to mock COMMITTEE", e);
      return COMMITTEE;
    }
  },

  async createCommitteeMember(data: any): Promise<any> {
    try {
      return await apiFetch<any>("/committee/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Failed to create committee member", e);
      throw e;
    }
  },

  // Family
  async getMyFamilies(): Promise<any[]> {
    try {
      return await apiFetch<any[]>("/families/");
    } catch (e) {
      console.warn("Failed to get families", e);
      return [];
    }
  },

  async createFamily(data: any): Promise<any> {
    return await apiFetch<any>("/families/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteFamily(id: number): Promise<void> {
    await apiFetch<void>(`/families/${id}/`, { method: "DELETE" });
  },

  async addFamilyMember(data: any): Promise<any> {
    return await apiFetch<any>("/family-members/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteFamilyMember(id: number): Promise<void> {
    await apiFetch<void>(`/family-members/${id}/`, { method: "DELETE" });
  },

  async updateFamilyMember(id: number, data: any): Promise<any> {
    return await apiFetch<any>(`/family-members/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

export default api;
