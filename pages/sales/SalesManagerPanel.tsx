
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Campaign, CampaignPlatform, CampaignLead } from '../../types';
import { PlusCircle, FileText, Upload, Instagram, Linkedin, Mail, Trash2, Edit2, Filter, ArrowLeft, FolderOpen, Search, ExternalLink, Plus, FileUp, X, Save } from 'lucide-react';

const SalesManagerPanel = () => {
  const { campaigns, addCampaign, updateCampaign, deleteCampaign, reports, addReport, storeFile, fileMap } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState<{name: string, platform: CampaignPlatform}>({
    name: '',
    platform: CampaignPlatform.EMAIL
  });

  // Filtering & Selection State
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // State for Leads (Add/Edit/Import)
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState<Partial<CampaignLead>>({});
  
  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [pasteData, setPasteData] = useState('');

  // Derived Data
  const filteredCampaigns = useMemo(() => {
    if (platformFilter === 'All') return campaigns;
    return campaigns.filter(c => c.platform === platformFilter);
  }, [campaigns, platformFilter]);

  const selectedCampaign = useMemo(() => {
    return campaigns.find(c => c.id === selectedCampaignId);
  }, [campaigns, selectedCampaignId]);

  // --- Campaign CRUD ---
  const handleSubmitCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name) return;

    if (editingId) {
      updateCampaign(editingId, {
        name: campaignForm.name,
        platform: campaignForm.platform
      });
      setEditingId(null);
    } else {
      addCampaign({
        id: Math.random().toString(),
        name: campaignForm.name,
        platform: campaignForm.platform,
        leadsGenerated: 0,
        status: 'Active',
        date: new Date().toISOString().split('T')[0],
        leads: [],
        documents: []
      });
    }
    setCampaignForm({ name: '', platform: CampaignPlatform.EMAIL });
  };

  const handleEditCampaign = (e: React.MouseEvent, camp: Campaign) => {
    e.stopPropagation();
    setEditingId(camp.id);
    setCampaignForm({ name: camp.name, platform: camp.platform });
  };

  const handleDeleteCampaign = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign(id);
      if (selectedCampaignId === id) setSelectedCampaignId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCampaignForm({ name: '', platform: CampaignPlatform.EMAIL });
  };

  // --- Daily Reports Logic ---
  const handleReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reportId = Math.random().toString();
    
    // Store file globally so Boss Panel can see it
    storeFile(reportId, file);

    // Add metadata to context
    addReport({
      id: reportId,
      fileName: file.name,
      date: new Date().toISOString().split('T')[0],
      uploader: 'Sales Manager'
    });

    // Reset input
    e.target.value = ''; 
  };

  const handleOpenReport = (report: { id: string, fileName: string }) => {
    const url = fileMap[report.id];
    if (url) {
      window.open(url, '_blank');
    } else {
      // Fallback if file isn't in local session memory (e.g. mock data from context init)
      alert(`Simulation: Opening "${report.fileName}".\n(In a real app, this would download from the server.)`);
    }
  };

  // --- Campaign Lead Logic ---
  
  // 1. Add / Edit Lead
  const handleLeadSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedCampaignId || !selectedCampaign) return;

      let updatedLeads = [...selectedCampaign.leads];

      if (editingLeadId) {
        // Edit Mode
        updatedLeads = updatedLeads.map(l => 
            l.id === editingLeadId ? { ...l, ...leadForm } : l
        );
      } else {
        // Add Mode
        const newLead: CampaignLead = {
            id: Math.random().toString(),
            status: 'Pending',
            ...leadForm
        };
        updatedLeads.push(newLead);
      }

      updateCampaign(selectedCampaignId, { leads: updatedLeads, leadsGenerated: updatedLeads.length });
      closeLeadModal();
  };

  const openAddLeadModal = () => {
      setLeadForm({});
      setEditingLeadId(null);
      setShowLeadModal(true);
  };

  const openEditLeadModal = (lead: CampaignLead) => {
      setLeadForm(lead);
      setEditingLeadId(lead.id);
      setShowLeadModal(true);
  };

  const closeLeadModal = () => {
      setShowLeadModal(false);
      setEditingLeadId(null);
      setLeadForm({});
  };

  const handleDeleteLead = (leadId: string) => {
      if (!selectedCampaignId || !selectedCampaign) return;
      if (confirm('Delete this lead?')) {
          const updatedLeads = selectedCampaign.leads.filter(l => l.id !== leadId);
          updateCampaign(selectedCampaignId, { leads: updatedLeads, leadsGenerated: updatedLeads.length });
      }
  };

  // 2. Import Leads
  const handleImportPaste = () => {
      if (!selectedCampaignId || !selectedCampaign) return;

      const rows = pasteData.trim().split('\n');
      const newLeads: CampaignLead[] = [];
      let count = 0;

      rows.forEach(row => {
          const cols = row.split(/[\t,]+/).map(c => c.trim()); // Split by tab or comma
          if (cols.length < 1 || !cols[0]) return;

          const lead: Partial<CampaignLead> = {
              id: Math.random().toString(),
              status: 'Pending'
          };

          // Map based on platform
          if (selectedCampaign.platform === CampaignPlatform.INSTAGRAM) {
              // Expect: Handle, Followers
              lead.instagramHandle = cols[0];
              lead.followersCount = cols[1] || '';
          } else if (selectedCampaign.platform === CampaignPlatform.LINKEDIN) {
              // Expect: Name, Profile
              lead.name = cols[0];
              lead.linkedinProfile = cols[1] || '';
          } else if (selectedCampaign.platform === CampaignPlatform.EMAIL) {
              // Expect: Name, Email, Company
              lead.name = cols[0];
              lead.email = cols[1] || '';
              lead.companyName = cols[2] || '';
          }

          newLeads.push(lead as CampaignLead);
          count++;
      });

      const updatedLeads = [...selectedCampaign.leads, ...newLeads];
      updateCampaign(selectedCampaignId, { leads: updatedLeads, leadsGenerated: updatedLeads.length });
      
      setPasteData('');
      setShowImportModal(false);
      alert(`Imported ${count} leads successfully!`);
  };

  const handleImportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          setPasteData(text); // Put content into paste area to allow preview/processing
      };
      reader.readAsText(file);
      e.target.value = '';
  };


  const getPlatformIcon = (p: CampaignPlatform) => {
    switch (p) {
      case CampaignPlatform.INSTAGRAM: return <Instagram size={16} className="text-pink-600" />;
      case CampaignPlatform.LINKEDIN: return <Linkedin size={16} className="text-blue-700" />;
      case CampaignPlatform.EMAIL: return <Mail size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center flex-none">
        <h1 className="text-3xl font-bold text-gray-800">Sales Campaigns</h1>
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
          Goal: 40 DMs / Day
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        {/* Left Column: Campaign Manager (List or Detail) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
          
          {/* View Switcher */}
          {!selectedCampaign ? (
            <>
                {/* Campaign Creator Form */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex-none">
                    <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                    {editingId ? <Edit2 className="mr-2 text-indigo-600" /> : <PlusCircle className="mr-2 text-indigo-600" />} 
                    {editingId ? 'Update Campaign' : 'Create New Campaign'}
                    </h2>
                    <form onSubmit={handleSubmitCampaign} className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Campaign Name</label>
                        <input 
                        type="text" 
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g., Summer Outreach"
                        required
                        />
                    </div>
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Platform</label>
                        <select 
                        value={campaignForm.platform}
                        onChange={(e) => setCampaignForm({...campaignForm, platform: e.target.value as CampaignPlatform})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                        {Object.values(CampaignPlatform).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        {editingId && (
                        <button type="button" onClick={handleCancelEdit} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                            Cancel
                        </button>
                        )}
                        <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                        {editingId ? 'Update' : 'Launch'}
                        </button>
                    </div>
                    </form>
                </div>

                {/* Campaign List */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col flex-1 min-h-0">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center flex-none">
                        <h2 className="font-bold text-gray-700 flex items-center"><FolderOpen size={18} className="mr-2 text-gray-500"/> Active Campaigns</h2>
                        
                        {/* Filter Dropdown */}
                        <div className="relative">
                            <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                            <select 
                                className="pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                                value={platformFilter}
                                onChange={(e) => setPlatformFilter(e.target.value)}
                            >
                                <option value="All">All Platforms</option>
                                {Object.values(CampaignPlatform).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                        {filteredCampaigns.map(camp => (
                        <div 
                            key={camp.id} 
                            onClick={() => setSelectedCampaignId(camp.id)}
                            className="p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                            <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white border border-gray-100 shadow-sm rounded-xl group-hover:border-indigo-200 transition-colors">
                                {getPlatformIcon(camp.platform)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 group-hover:text-indigo-700">{camp.name}</p>
                                <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                    {camp.date} • {camp.status}
                                </p>
                            </div>
                            </div>
                            <div className="flex items-center space-x-6">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-800">{camp.leads.length} Leads</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={(e) => handleEditCampaign(e, camp)} className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"><Edit2 size={16} /></button>
                                <button onClick={(e) => handleDeleteCampaign(e, camp.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                            </div>
                            </div>
                        </div>
                        ))}
                        {filteredCampaigns.length === 0 && (
                            <div className="p-12 text-center flex flex-col items-center text-gray-400">
                                <Search size={32} className="mb-2 opacity-50"/>
                                <p>No campaigns found matching filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </>
          ) : (
            /* Campaign Detail View (Leads List) */
            <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col h-full animate-in slide-in-from-right-4 duration-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-none">
                    <div className="flex items-center">
                        <button 
                            onClick={() => setSelectedCampaignId(null)}
                            className="mr-4 p-2 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                {getPlatformIcon(selectedCampaign.platform)}
                                {selectedCampaign.name}
                            </h2>
                            <p className="text-xs text-gray-500">{selectedCampaign.leads.length} Leads</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowImportModal(true)}
                            className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center hover:bg-indigo-200 transition-colors"
                        >
                            <FileUp size={16} className="mr-1" /> Import Leads
                        </button>
                        <button 
                            onClick={openAddLeadModal}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center hover:bg-indigo-700 transition-colors"
                        >
                            <Plus size={16} className="mr-1" /> Add Lead
                        </button>
                    </div>
                </div>
                
                {/* Leads Table - Full Width */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider border-b sticky top-0 z-10 shadow-sm">
                            <tr>
                                {selectedCampaign.platform === CampaignPlatform.INSTAGRAM && (
                                    <>
                                        <th className="px-4 py-3">Instagram Handle</th>
                                        <th className="px-4 py-3">Followers</th>
                                    </>
                                )}
                                {selectedCampaign.platform === CampaignPlatform.LINKEDIN && (
                                        <>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">LinkedIn Profile</th>
                                    </>
                                )}
                                {selectedCampaign.platform === CampaignPlatform.EMAIL && (
                                        <>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Company</th>
                                    </>
                                )}
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {selectedCampaign.leads.map(lead => (
                                <tr key={lead.id} className="hover:bg-gray-50 group">
                                    {selectedCampaign.platform === CampaignPlatform.INSTAGRAM && (
                                    <>
                                        <td className="px-4 py-3 font-medium text-gray-900">{lead.instagramHandle}</td>
                                        <td className="px-4 py-3 text-gray-500">{lead.followersCount}</td>
                                    </>
                                    )}
                                    {selectedCampaign.platform === CampaignPlatform.LINKEDIN && (
                                            <>
                                            <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                                            <td className="px-4 py-3 text-blue-600 hover:underline flex items-center">
                                                {lead.linkedinProfile} <ExternalLink size={12} className="ml-1"/>
                                            </td>
                                        </>
                                    )}
                                    {selectedCampaign.platform === CampaignPlatform.EMAIL && (
                                            <>
                                            <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                                            <td className="px-4 py-3 text-gray-500">{lead.email}</td>
                                            <td className="px-4 py-3 text-gray-500">{lead.companyName}</td>
                                        </>
                                    )}
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${lead.status === 'Converted' ? 'bg-green-100 text-green-700' : 
                                                lead.status === 'Replied' ? 'bg-blue-100 text-blue-700' : 
                                                'bg-gray-100 text-gray-600'}`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditLeadModal(lead)} className="text-blue-600 hover:bg-blue-100 p-1 rounded transition-colors"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDeleteLead(lead.id)} className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {selectedCampaign.leads.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 italic">
                                        No leads added yet. Import or add manually.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

        </div>

        {/* Right Column: Daily Reports (Fixed) */}
        <div className="space-y-6 flex flex-col min-h-0">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center flex-none">
              <FileText className="mr-2 text-orange-500" /> Daily Reports
            </h2>
            
            <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer mb-6 flex-none group">
              <Upload className="mx-auto text-gray-400 mb-2 group-hover:text-indigo-500 transition-colors" size={32} />
              <p className="text-sm font-medium text-gray-600">Upload Report</p>
              <p className="text-xs text-gray-400 mt-1">.docx, .pdf, .xlsx</p>
              <input type="file" className="hidden" onChange={handleReportUpload} />
            </label>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sticky top-0 bg-white py-1">Recent Uploads</h3>
              {reports.map(report => (
                <div 
                    key={report.id} 
                    onClick={() => handleOpenReport(report)}
                    className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors group"
                >
                  <FileText size={16} className="text-blue-500 mr-3 flex-shrink-0 group-hover:text-blue-600" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-gray-700 truncate group-hover:text-indigo-700 group-hover:underline">{report.fileName}</p>
                    <p className="text-xs text-gray-400">{report.date}</p>
                  </div>
                  <ExternalLink size={12} className="text-gray-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100" />
                </div>
              ))}
              {reports.length === 0 && <p className="text-center text-sm text-gray-400 italic mt-4">No reports yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add/Edit Lead */}
      {showLeadModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center">
                          {editingLeadId ? <Edit2 size={20} className="mr-2 text-indigo-600" /> : <PlusCircle size={20} className="mr-2 text-indigo-600" />}
                          {editingLeadId ? 'Edit Lead' : `Add ${selectedCampaign.platform} Lead`}
                      </h3>
                      <button onClick={closeLeadModal} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>

                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                      
                      {/* Instagram Fields */}
                      {selectedCampaign.platform === CampaignPlatform.INSTAGRAM && (
                          <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instagram Handle</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-indigo-500"
                                    value={leadForm.instagramHandle || ''}
                                    onChange={e => setLeadForm({...leadForm, instagramHandle: e.target.value})}
                                    placeholder="@username"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Followers Count</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-indigo-500"
                                    value={leadForm.followersCount || ''}
                                    onChange={e => setLeadForm({...leadForm, followersCount: e.target.value})}
                                    placeholder="e.g. 10k"
                                />
                            </div>
                          </>
                      )}

                      {/* LinkedIn Fields */}
                      {selectedCampaign.platform === CampaignPlatform.LINKEDIN && (
                          <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-indigo-500"
                                    value={leadForm.name || ''}
                                    onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">LinkedIn Profile URL</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-indigo-500"
                                    value={leadForm.linkedinProfile || ''}
                                    onChange={e => setLeadForm({...leadForm, linkedinProfile: e.target.value})}
                                    placeholder="https://linkedin.com/in/..."
                                    required
                                />
                            </div>
                          </>
                      )}

                      {/* Email Fields */}
                      {selectedCampaign.platform === CampaignPlatform.EMAIL && (
                          <>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-indigo-500"
                                    value={leadForm.name || ''}
                                    onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                                <input 
                                    type="email"
                                    className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-indigo-500"
                                    value={leadForm.email || ''}
                                    onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Name</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-indigo-500"
                                    value={leadForm.companyName || ''}
                                    onChange={e => setLeadForm({...leadForm, companyName: e.target.value})}
                                />
                            </div>
                          </>
                      )}
                       
                       <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                            <select 
                                className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-indigo-500"
                                value={leadForm.status || 'Pending'}
                                onChange={e => setLeadForm({...leadForm, status: e.target.value as any})}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Replied">Replied</option>
                                <option value="Converted">Converted</option>
                            </select>
                        </div>

                      <div className="pt-4 flex justify-end">
                          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                              {editingLeadId ? 'Save Changes' : 'Add Lead'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modal: Import Leads */}
      {showImportModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <FileUp size={20} className="mr-2 text-indigo-600" />
                        Import Leads ({selectedCampaign.platform})
                    </h3>
                    <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-gray-600 mb-2 font-medium">Option 1: Paste Text</p>
                        <p className="text-xs text-gray-400 mb-2">
                            {selectedCampaign.platform === CampaignPlatform.INSTAGRAM && "Format: Handle, Followers"}
                            {selectedCampaign.platform === CampaignPlatform.LINKEDIN && "Format: Name, Profile URL"}
                            {selectedCampaign.platform === CampaignPlatform.EMAIL && "Format: Name, Email, Company"}
                        </p>
                        <textarea 
                            className="w-full h-40 border border-gray-300 rounded-lg p-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Paste data here..."
                            value={pasteData}
                            onChange={(e) => setPasteData(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Option 2: Upload File</p>
                        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors mb-4">
                            <Upload size={24} className="text-indigo-400 mb-2"/>
                            <span className="text-xs text-indigo-600 font-semibold">Select CSV / Text File</span>
                            <input type="file" className="hidden" accept=".csv,.txt" onChange={handleImportFileUpload} />
                        </label>
                        <button 
                            onClick={handleImportPaste}
                            disabled={!pasteData}
                            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center
                                ${pasteData ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            <Save size={16} className="mr-2"/> Process & Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SalesManagerPanel;
