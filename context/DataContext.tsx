
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Lead, Project, Campaign, DailyReport, LeadStatus, ProjectStatus, CampaignPlatform, UserRole, FolderNode } from '../types';

interface DataContextType {
  leads: Lead[];
  projects: Project[];
  campaigns: Campaign[];
  reports: DailyReport[];
  folders: FolderNode;
  fileMap: Record<string, string>; // ID -> Blob URL
  
  // Leads
  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;

  // Projects
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Campaigns
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  // Reports
  addReport: (report: DailyReport) => void;

  // Files
  storeFile: (id: string, file: File) => void;

  // Folders
  addFolder: (parentId: string, name: string, type: 'country' | 'city' | 'category') => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Storage Keys
const STORAGE_KEYS = {
  LEADS: 'raulo_crm_leads',
  PROJECTS: 'raulo_crm_projects',
  CAMPAIGNS: 'raulo_crm_campaigns',
  REPORTS: 'raulo_crm_reports',
  FOLDERS: 'raulo_crm_folders',
};

// Mock Data
const INITIAL_LEADS: Lead[] = [
  { id: '1', name: 'Supreme Interiors', city: 'Mumbai', category: 'Interior Designers', phone: '099201 61633', status: LeadStatus.INTERESTED_BOOKED, meetingDate: '2023-10-15T14:00', socialMediaLinks: ['https://instagram.com/supreme_interiors'] },
  { id: '2', name: 'Artneit Designs', city: 'Mumbai', category: 'Interior Designers', phone: '075068 03602', status: LeadStatus.INTERESTED_NOT_BOOKED, remarks: 'Busy, call later', socialMediaLinks: [] },
  { id: '3', name: 'Bandra Cafe', city: 'Mumbai', category: 'Cafes', phone: '098765 43210', status: LeadStatus.NEW, socialMediaLinks: ['https://facebook.com/bandracafe', 'https://instagram.com/bandracafe'] },
  { id: '4', name: 'Delhi Estate', city: 'Delhi', category: 'Real Estate', phone: '011223 34455', status: LeadStatus.NOT_INTERESTED, socialMediaLinks: [] },
];

const INITIAL_PROJECTS: Project[] = [
  { 
    id: '1', 
    name: 'Raulo CRM V1', 
    client: 'Internal', 
    status: ProjectStatus.ONGOING, 
    description: 'Developing the internal CRM system.', 
    progress: 65, 
    documents: ['specs.pdf'],
    milestones: [
        { id: 'm1', title: 'UI Design', isCompleted: true }, 
        { id: 'm2', title: 'Frontend Dev', isCompleted: true },
        { id: 'm3', title: 'Backend Integration', isCompleted: false }
    ] 
  },
  { 
    id: '2', 
    name: 'E-commerce Redesign', 
    client: 'ShopifyClient', 
    status: ProjectStatus.UPCOMING, 
    description: 'Redesigning the checkout flow.', 
    progress: 0, 
    documents: [],
    milestones: [{ id: 'm4', title: 'Kickoff Meeting', isCompleted: false }] 
  },
  { 
    id: '3', 
    name: 'Social Booster', 
    client: 'InfluencerAgency', 
    status: ProjectStatus.COMPLETED, 
    description: 'Setting up social media handles and content.', 
    progress: 100, 
    documents: [],
    milestones: [{ id: 'm5', title: 'Create Accounts', isCompleted: true }] 
  }
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  { 
    id: '1', 
    name: 'Winter Email Blast', 
    platform: CampaignPlatform.EMAIL, 
    leadsGenerated: 2, 
    status: 'Active', 
    date: new Date().toISOString().split('T')[0],
    documents: ['email_copy_v1.pdf'],
    leads: [
      { id: 'e1', name: 'John Doe', email: 'john@corp.com', companyName: 'MegaCorp', status: 'Contacted' },
      { id: 'e2', name: 'Jane Smith', email: 'jane@start.up', companyName: 'StartUp Inc', status: 'Replied' }
    ]
  },
  { 
    id: '2', 
    name: 'CEO Outreach', 
    platform: CampaignPlatform.LINKEDIN, 
    leadsGenerated: 1, 
    status: 'Active', 
    date: new Date().toISOString().split('T')[0],
    documents: [],
    leads: [
      { id: 'l1', name: 'Michael Scott', linkedinProfile: 'linkedin.com/in/mscott', status: 'Converted' }
    ]
  },
  { 
    id: '3', 
    name: 'Influencer Collab', 
    platform: CampaignPlatform.INSTAGRAM, 
    leadsGenerated: 2, 
    status: 'Active', 
    date: new Date().toISOString().split('T')[0],
    documents: ['influencer_list.xlsx'],
    leads: [
      { id: 'i1', instagramHandle: '@design_daily', followersCount: '12.5k', status: 'Contacted' },
      { id: 'i2', instagramHandle: '@arch_lovers', followersCount: '45k', status: 'Pending' }
    ]
  },
];

const INITIAL_FOLDERS: FolderNode = {
  id: 'root',
  name: 'Global Database',
  type: 'root',
  children: [
    {
      id: 'in',
      name: 'India',
      type: 'country',
      children: [
        {
          id: 'mumbai',
          name: 'Mumbai',
          type: 'city',
          children: [
            { id: 'mum-real', name: 'Real Estate', type: 'category' },
            { id: 'mum-cafe', name: 'Cafes', type: 'category' },
            { id: 'mum-int', name: 'Interior Designers', type: 'category' },
          ]
        },
        {
          id: 'delhi',
          name: 'Delhi',
          type: 'city',
          children: [
            { id: 'del-real', name: 'Real Estate', type: 'category' },
          ]
        }
      ]
    }
  ]
};

// Helper to load state from LocalStorage
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.error(`Failed to load ${key} from local storage`, e);
    return fallback;
  }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(() => loadFromStorage(STORAGE_KEYS.LEADS, INITIAL_LEADS));
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS));
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadFromStorage(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS));
  const [reports, setReports] = useState<DailyReport[]>(() => loadFromStorage(STORAGE_KEYS.REPORTS, []));
  const [folders, setFolders] = useState<FolderNode>(() => loadFromStorage(STORAGE_KEYS.FOLDERS, INITIAL_FOLDERS));
  const [fileMap, setFileMap] = useState<Record<string, string>>({});

  // Persist to LocalStorage on changes
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns)); }, [campaigns]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders)); }, [folders]);

  // Lead Actions
  const addLead = (lead: Lead) => setLeads(prev => [...prev, lead]);
  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };
  const deleteLead = (id: string) => setLeads(prev => prev.filter(l => l.id !== id));

  // Project Actions
  const addProject = (project: Project) => setProjects(prev => [...prev, project]);
  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };
  const deleteProject = (id: string) => {
      setProjects(prev => prev.filter(p => p.id !== id));
  }

  // Campaign Actions
  const addCampaign = (campaign: Campaign) => setCampaigns(prev => [...prev, campaign]);
  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteCampaign = (id: string) => setCampaigns(prev => prev.filter(c => c.id !== id));

  // Report Actions
  const addReport = (report: DailyReport) => setReports(prev => [...prev, report]);

  // File Actions
  const storeFile = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    setFileMap(prev => ({ ...prev, [id]: url }));
  };

  // Folder Actions (Recursive)
  const addFolder = (parentId: string, name: string, type: 'country' | 'city' | 'category') => {
    const newFolder: FolderNode = { id: Math.random().toString(36).substr(2, 9), name, type, children: [] };
    
    const addNodeRecursive = (node: FolderNode): FolderNode => {
      if (node.id === parentId) {
        return { ...node, children: [...(node.children || []), newFolder] };
      }
      if (node.children) {
        return { ...node, children: node.children.map(addNodeRecursive) };
      }
      return node;
    };
    setFolders(prev => addNodeRecursive(prev));
  };

  const renameFolder = (id: string, name: string) => {
    const updateNodeRecursive = (node: FolderNode): FolderNode => {
      if (node.id === id) return { ...node, name };
      if (node.children) return { ...node, children: node.children.map(updateNodeRecursive) };
      return node;
    };
    setFolders(prev => updateNodeRecursive(prev));
  };

  const deleteFolder = (id: string) => {
    const deleteNodeRecursive = (node: FolderNode): FolderNode => {
        // If children contains the ID, filter it out
        if (node.children) {
            const filteredChildren = node.children.filter(child => child.id !== id);
            // If we filtered something, we return the new node
            if (filteredChildren.length !== node.children.length) {
                return { ...node, children: filteredChildren };
            }
            // Otherwise continue searching deeper
            return { ...node, children: node.children.map(deleteNodeRecursive) };
        }
        return node;
    };
    
    // Special case: cannot delete root from here usually, but let's handle children
    setFolders(prev => deleteNodeRecursive(prev));
  };

  return (
    <DataContext.Provider value={{
      leads,
      projects,
      campaigns,
      reports,
      folders,
      fileMap,
      addLead,
      updateLead,
      deleteLead,
      addProject,
      updateProject,
      deleteProject,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      addReport,
      storeFile,
      addFolder,
      renameFolder,
      deleteFolder
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
