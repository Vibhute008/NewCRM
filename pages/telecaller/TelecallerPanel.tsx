
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { FolderNode, Lead, LeadStatus } from '../../types';
import { ChevronRight, ChevronDown, Folder, Database, Plus, Save, Trash2, Edit2, MoreVertical, FilePlus, X, Search, Filter, Upload, FileUp, Globe, MapPin, Share2, Instagram, Facebook, Linkedin, ExternalLink } from 'lucide-react';

// Helper for ID
const generateId = () => Math.random().toString(36).substr(2, 9);

interface TreeNodeProps {
  node: FolderNode;
  onSelect: (node: FolderNode) => void;
  selectedId: string;
  level?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, onSelect, selectedId, level = 0 }) => {
  const { addFolder, renameFolder, deleteFolder } = useData();
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleAddSubfolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Determine next level type
    let nextType: 'country' | 'city' | 'category' = 'category';
    let nextTypeLabel = 'Category';
    
    if (node.type === 'root') {
        nextType = 'country';
        nextTypeLabel = 'Country';
    } else if (node.type === 'country') {
        nextType = 'city';
        nextTypeLabel = 'City';
    }

    const name = prompt(`Enter new ${nextTypeLabel} name:`);
    if (!name) return;
    
    addFolder(node.id, name, nextType);
    setIsOpen(true);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt("Enter new name:", node.name);
    if (name) renameFolder(node.id, name);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete folder "${node.name}" and all its contents?`)) {
      deleteFolder(node.id);
    }
  };

  const getIcon = () => {
      if (node.type === 'root') return <Database size={14} className="mr-2 text-indigo-600" />;
      if (node.type === 'country') return <Globe size={14} className="mr-2 text-blue-500" />;
      if (node.type === 'city') return <MapPin size={14} className="mr-2 text-red-500" />;
      return <Folder size={14} className="mr-2 text-yellow-500" />;
  };
  
  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1.5 px-2 cursor-pointer transition-colors group relative ${selectedId === node.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span 
          className="mr-1 text-gray-400 hover:text-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3.5 inline-block" />}
        </span>
        {getIcon()}
        <span className="text-sm truncate max-w-[120px]">{node.name}</span>

        {/* Folder Actions */}
        {isHovered && (
          <div className="absolute right-2 flex space-x-1 bg-white/90 rounded shadow-sm px-1">
             {node.type !== 'category' && (
               <button onClick={handleAddSubfolder} title="Add Subfolder" className="text-green-600 hover:bg-green-100 rounded p-0.5">
                 <Plus size={12} />
               </button>
             )}
             {node.type !== 'root' && (
               <>
                <button onClick={handleRename} title="Rename" className="text-blue-600 hover:bg-blue-100 rounded p-0.5">
                  <Edit2 size={12} />
                </button>
                <button onClick={handleDelete} title="Delete" className="text-red-600 hover:bg-red-100 rounded p-0.5">
                  <Trash2 size={12} />
                </button>
               </>
             )}
          </div>
        )}
      </div>
      {isOpen && hasChildren && (
        <div>
          {node.children!.map(child => (
            <TreeNode key={child.id} node={child} onSelect={onSelect} selectedId={selectedId} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const TelecallerPanel = () => {
  const { leads, folders, addLead, updateLead, deleteLead } = useData();
  const [selectedNode, setSelectedNode] = useState<FolderNode>(folders);
  const [showImport, setShowImport] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [pasteData, setPasteData] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Lead Form State
  const [leadForm, setLeadForm] = useState<Partial<Lead>>({
    name: '',
    city: '',
    category: '',
    phone: '',
    status: LeadStatus.NEW,
    remarks: '',
    socialMediaLinks: []
  });

  // Temp social link input in modal
  const [newSocialLink, setNewSocialLink] = useState('');

  // Sync selectedNode with updated folders from context
  const findNode = (root: FolderNode, id: string): FolderNode | null => {
      if (root.id === id) return root;
      if (root.children) {
          for (const child of root.children) {
              const found = findNode(child, id);
              if (found) return found;
          }
      }
      return null;
  };

  const activeNode = useMemo(() => {
      return findNode(folders, selectedNode.id) || folders;
  }, [folders, selectedNode.id]);


  // Filter leads
  const filteredLeads = useMemo(() => {
    let result = [];
    
    // 1. Tree Filter
    if (activeNode.type === 'root') {
        result = leads;
    } 
    else if (activeNode.type === 'country') {
        // Show leads from all cities in this country
        const cityNames = activeNode.children?.map(c => c.name) || [];
        result = leads.filter(l => cityNames.includes(l.city));
    }
    else if (activeNode.type === 'city') {
        result = leads.filter(l => l.city === activeNode.name);
    }
    else if (activeNode.type === 'category') {
        result = leads.filter(l => l.category === activeNode.name);
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(l => 
            l.name.toLowerCase().includes(q) || 
            l.phone.includes(q) ||
            l.city.toLowerCase().includes(q)
        );
    }

    // 3. Status Filter
    if (statusFilter !== 'All') {
        result = result.filter(l => l.status === statusFilter);
    }

    return result;
  }, [leads, activeNode, searchQuery, statusFilter]);

  const handleImportPaste = () => {
    const rows = pasteData.trim().split('\n');
    let importedCount = 0;
    
    rows.forEach(row => {
      const cols = row.split('\t');
      if (cols.length >= 2) {
        addLead({
          id: generateId(),
          name: cols[0]?.trim() || 'Unknown',
          city: cols[1]?.trim() || (activeNode.type === 'city' ? activeNode.name : 'Unknown'),
          category: cols[2]?.trim() || (activeNode.type === 'category' ? activeNode.name : 'General'),
          phone: cols[3]?.trim() || '',
          status: LeadStatus.NEW,
          remarks: '',
          socialMediaLinks: []
        });
        importedCount++;
      }
    });
    
    setPasteData('');
    setShowImport(false);
    alert(`Successfully imported ${importedCount} leads from text!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n');
      let importedCount = 0;

      // Skip header row if it exists (heuristic: check if first row has "Name" or "Phone")
      const startIndex = (rows[0].toLowerCase().includes('name') || rows[0].toLowerCase().includes('phone')) ? 1 : 0;

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        
        // Split by comma (CSV)
        const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, '')); // basic csv cleanup
        
        // Expected format: Name, City, Category, Phone
        if (cols.length >= 1) {
             addLead({
                id: generateId(),
                name: cols[0] || 'Unknown',
                city: cols[1] || (activeNode.type === 'city' ? activeNode.name : 'Imported'),
                category: cols[2] || (activeNode.type === 'category' ? activeNode.name : 'General'),
                phone: cols[3] || '',
                status: LeadStatus.NEW,
                remarks: 'Imported via CSV',
                socialMediaLinks: []
             });
             importedCount++;
        }
      }
      
      setShowImport(false);
      alert(`Successfully imported ${importedCount} leads from CSV!`);
    };
    reader.readAsText(file);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLeadId) {
        updateLead(editingLeadId, leadForm);
    } else {
        addLead({
            id: generateId(),
            name: leadForm.name || 'New Lead',
            city: leadForm.city || (activeNode.type === 'city' ? activeNode.name : 'Unknown'),
            category: leadForm.category || (activeNode.type === 'category' ? activeNode.name : 'General'),
            phone: leadForm.phone || '',
            status: leadForm.status || LeadStatus.NEW,
            remarks: leadForm.remarks || '',
            meetingDate: leadForm.meetingDate,
            socialMediaLinks: leadForm.socialMediaLinks || []
        } as Lead);
    }
    closeModal();
  };

  const openEditModal = (lead: Lead) => {
      setLeadForm(lead);
      setEditingLeadId(lead.id);
      setNewSocialLink('');
      setShowLeadModal(true);
  }

  const openAddModal = () => {
      setLeadForm({
        name: '',
        city: activeNode.type === 'city' ? activeNode.name : '',
        category: activeNode.type === 'category' ? activeNode.name : '',
        phone: '',
        status: LeadStatus.NEW,
        remarks: '',
        socialMediaLinks: []
      });
      setEditingLeadId(null);
      setNewSocialLink('');
      setShowLeadModal(true);
  }

  const closeModal = () => {
      setShowLeadModal(false);
      setEditingLeadId(null);
  }

  const addSocialLink = () => {
    if(newSocialLink) {
        setLeadForm(prev => ({
            ...prev,
            socialMediaLinks: [...(prev.socialMediaLinks || []), newSocialLink]
        }));
        setNewSocialLink('');
    }
  };

  const removeSocialLink = (index: number) => {
      setLeadForm(prev => ({
          ...prev,
          socialMediaLinks: (prev.socialMediaLinks || []).filter((_, i) => i !== index)
      }));
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.INTERESTED_BOOKED: return 'bg-green-100 text-green-800';
      case LeadStatus.INTERESTED_NOT_BOOKED: return 'bg-yellow-100 text-yellow-800';
      case LeadStatus.NOT_INTERESTED: return 'bg-red-100 text-red-800';
      case LeadStatus.FOLLOW_UP: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSocialIcon = (url: string) => {
    if (url.includes('instagram')) return <Instagram size={14} className="text-pink-600" />;
    if (url.includes('facebook')) return <Facebook size={14} className="text-blue-600" />;
    if (url.includes('linkedin')) return <Linkedin size={14} className="text-blue-800" />;
    return <Globe size={14} className="text-gray-500" />;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Sidebar Tree */}
      <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 shrink-0">
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h2 className="font-bold text-gray-700 flex items-center">
            <Database size={18} className="mr-2 text-indigo-600" />
            Directory
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <TreeNode node={folders} onSelect={setSelectedNode} selectedId={activeNode.id} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-800 truncate flex items-center gap-2">
                {activeNode.type === 'country' && <Globe size={20} className="text-blue-500"/>}
                {activeNode.type === 'city' && <MapPin size={20} className="text-red-500"/>}
                {activeNode.name}
            </h1>
            <p className="text-sm text-gray-500">{filteredLeads.length} leads found</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
             {/* Filters */}
             <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search name or phone..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
             </div>

             {/* Actions */}
             <div className="flex gap-2">
                <button 
                onClick={() => setShowImport(!showImport)}
                className="flex items-center justify-center bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors shadow-sm text-sm font-medium"
                >
                <FilePlus size={16} className="mr-2" />
                Import
                </button>
                <button 
                onClick={openAddModal}
                className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
                >
                <Plus size={16} className="mr-2" />
                Add Lead
                </button>
             </div>
          </div>
        </div>

        {/* Import Modal Area */}
        {showImport && (
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center"><Upload size={16} className="mr-2"/> Import Leads</h3>
                <button onClick={() => setShowImport(false)} className="text-indigo-400 hover:text-indigo-600"><X size={18}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: File Upload */}
                <div className="border-2 border-dashed border-indigo-200 rounded-lg p-6 bg-white flex flex-col items-center justify-center text-center group hover:border-indigo-400 transition-colors relative">
                    <FileUp size={32} className="text-indigo-300 mb-2 group-hover:text-indigo-500 transition-colors" />
                    <p className="text-sm font-medium text-gray-700">Upload CSV File</p>
                    <p className="text-xs text-gray-400 mt-1">Format: Name, City, Category, Phone</p>
                    <input 
                        type="file" 
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>

                {/* Option 2: Paste Data */}
                <div className="flex flex-col">
                     <textarea
                        className="flex-1 w-full p-3 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-2 min-h-[100px]"
                        placeholder={`Paste from Excel/Sheets:\nName\tCity\tCategory\tPhone`}
                        value={pasteData}
                        onChange={(e) => setPasteData(e.target.value)}
                    ></textarea>
                    <button onClick={handleImportPaste} className="self-end px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center shadow-sm">
                        <Save size={14} className="mr-1" /> Process Pasted Data
                    </button>
                </div>
            </div>
          </div>
        )}

        {/* Add/Edit Lead Modal */}
        {showLeadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-[500px] shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-lg font-bold text-gray-800">{editingLeadId ? 'Edit Lead' : 'Add New Lead'}</h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSaveLead} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                            <input type="text" className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                            <input type="text" className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                            <input type="text" className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" value={leadForm.city} onChange={e => setLeadForm({...leadForm, city: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                            <input type="text" className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" value={leadForm.category} onChange={e => setLeadForm({...leadForm, category: e.target.value})} required />
                        </div>
                    </div>
                    
                    {/* Social Media Section */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Social Media Links</label>
                        <div className="flex space-x-2 mb-2">
                            <input 
                                type="text" 
                                className="flex-1 border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                                placeholder="https://instagram.com/..." 
                                value={newSocialLink} 
                                onChange={e => setNewSocialLink(e.target.value)} 
                            />
                            <button type="button" onClick={addSocialLink} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm font-medium hover:bg-indigo-200">Add</button>
                        </div>
                        <div className="space-y-1">
                            {leadForm.socialMediaLinks?.map((link, i) => (
                                <div key={i} className="flex justify-between items-center bg-white p-1.5 rounded border border-gray-200 text-xs">
                                    <span className="truncate flex-1 text-gray-600 mr-2">{link}</span>
                                    <button type="button" onClick={() => removeSocialLink(i)} className="text-red-500 hover:text-red-700"><X size={12}/></button>
                                </div>
                            ))}
                            {(!leadForm.socialMediaLinks || leadForm.socialMediaLinks.length === 0) && <p className="text-xs text-gray-400 italic">No links added.</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                        <select className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" value={leadForm.status} onChange={e => setLeadForm({...leadForm, status: e.target.value as LeadStatus})}>
                             {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Remarks</label>
                        <textarea className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" rows={2} value={leadForm.remarks} onChange={e => setLeadForm({...leadForm, remarks: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meeting Date</label>
                        <input type="datetime-local" className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" value={leadForm.meetingDate || ''} onChange={e => setLeadForm({...leadForm, meetingDate: e.target.value})} />
                    </div>
                    <div className="pt-4 flex justify-end space-x-2 border-t mt-2">
                        <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">Save Lead</button>
                    </div>
                </form>
            </div>
          </div>
        )}

        {/* CRM Table */}
        <div className="flex-1 overflow-auto bg-white relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 border-b">Name</th>
                <th className="px-4 py-3 border-b">City / Category</th>
                <th className="px-4 py-3 border-b">Phone</th>
                <th className="px-4 py-3 border-b">Socials</th>
                <th className="px-4 py-3 border-b">Status</th>
                <th className="px-4 py-3 border-b">Remarks</th>
                <th className="px-4 py-3 border-b">Meeting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-blue-50 transition-colors group">
                  <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                  <td className="px-4 py-3 text-gray-500">{lead.city} • {lead.category}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{lead.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-1">
                        {lead.socialMediaLinks?.map((link, i) => (
                            <a key={i} href={link} target="_blank" rel="noreferrer" className="p-1 hover:bg-gray-200 rounded-full transition-colors" title={link}>
                                {getSocialIcon(link)}
                            </a>
                        ))}
                        {(!lead.socialMediaLinks || lead.socialMediaLinks.length === 0) && <span className="text-gray-300">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select 
                      value={lead.status}
                      onChange={(e) => updateLead(lead.id, { status: e.target.value as LeadStatus })}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer outline-none ring-1 ring-inset ring-gray-200 ${getStatusColor(lead.status)}`}
                    >
                      {Object.values(LeadStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={lead.remarks || ''}
                      onChange={(e) => updateLead(lead.id, { remarks: e.target.value })}
                      placeholder="Add remarks..."
                      className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-gray-600 placeholder-gray-300"
                    />
                  </td>
                   <td className="px-4 py-3 relative">
                     <input 
                      type="datetime-local"
                      value={lead.meetingDate || ''}
                      onChange={(e) => updateLead(lead.id, { meetingDate: e.target.value })}
                      className="bg-transparent text-gray-500 text-xs focus:text-indigo-600 outline-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-gray-200 rounded-md px-1">
                        <button onClick={() => openEditModal(lead)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => { if(confirm('Delete lead?')) deleteLead(lead.id) }} className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Delete"><Trash2 size={14} /></button>
                    </div>
                   </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    {searchQuery || statusFilter !== 'All' ? 'No leads match your filters.' : 'No leads found here. Select a folder or add data!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TelecallerPanel;
