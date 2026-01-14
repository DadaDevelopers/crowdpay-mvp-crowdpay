import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { mockLinks as initialMockLinks, mockContributions } from "@/data/mockLinks";

export interface Link {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  goal_amount: number;
  mode: string;
  category: string;
  cover_image_url: string | null;
  theme_color: string;
  is_public: boolean;
  created_at: string;
  end_date?: string;
  event_location?: string;
}

interface LinksContextType {
  links: Link[];
  addLink: (link: Link) => void;
  getLinkBySlug: (slug: string) => Link | undefined;
  getUserLinks: (userId: string) => Link[];
  getPublicLinks: () => Link[];
}

const LinksContext = createContext<LinksContextType | undefined>(undefined);

const STORAGE_KEY = "crowdpay_links";

// Helper function to load links from localStorage
const loadLinksFromStorage = (): Link[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with mock links, avoiding duplicates by ID
      const mockLinksMap = new Map(initialMockLinks.map(link => [link.id, link]));
      const storedLinksMap = new Map(parsed.map((link: Link) => [link.id, link]));
      
      // Combine: stored links take precedence, then mock links
      const combined = [...Array.from(storedLinksMap.values()), ...Array.from(mockLinksMap.values())];
      // Remove duplicates by keeping first occurrence
      const unique = Array.from(
        new Map(combined.map(link => [link.id, link])).values()
      );
      return unique as Link[];
    }
  } catch (error) {
    console.error("Error loading links from storage:", error);
    localStorage.removeItem(STORAGE_KEY);
  }
  return initialMockLinks as Link[];
};

// Helper function to save links to localStorage
const saveLinksToStorage = (links: Link[]) => {
  try {
    // Only save user-created links (not mock links)
    const userCreatedLinks = links.filter(link => 
      !initialMockLinks.some(mockLink => mockLink.id === link.id)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userCreatedLinks));
  } catch (error) {
    console.error("Error saving links to storage:", error);
  }
};

export const LinksProvider = ({ children }: { children: ReactNode }) => {
  const [links, setLinks] = useState<Link[]>(() => loadLinksFromStorage());

  // Load links from localStorage on mount
  useEffect(() => {
    const loadedLinks = loadLinksFromStorage();
    setLinks(loadedLinks);
  }, []);

  const addLink = (link: Link) => {
    setLinks(prev => {
      const updated = [link, ...prev];
      saveLinksToStorage(updated);
      return updated;
    });
  };

  const getLinkBySlug = (slug: string) => {
    return links.find(l => l.slug === slug);
  };

  const getUserLinks = (userId: string) => {
    return links.filter(l => l.user_id === userId);
  };

  const getPublicLinks = () => {
    return links.filter(l => l.is_public);
  };

  return (
    <LinksContext.Provider value={{ links, addLink, getLinkBySlug, getUserLinks, getPublicLinks }}>
      {children}
    </LinksContext.Provider>
  );
};

export const useLinks = () => {
  const context = useContext(LinksContext);
  if (context === undefined) {
    throw new Error("useLinks must be used within a LinksProvider");
  }
  return context;
};

export { mockContributions };

