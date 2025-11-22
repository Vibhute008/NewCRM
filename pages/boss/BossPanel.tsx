
import React from 'react';
import { useData } from '../../context/DataContext';
import { LeadStatus } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, PhoneCall, Code, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const BossPanel = () => {
  const { leads, projects, campaigns, reports, fileMap } = useData();

  // Stats Calculation
  const totalLeads = leads.length;
  const interestedLeads = leads.filter(l => l.status === LeadStatus.INTERESTED_BOOKED || l.status === LeadStatus.INTERESTED_NOT_BOOKED).length;
  const bookedMeetings = leads.filter(l => l.status === LeadStatus.INTERESTED_BOOKED).length;
  const conversionRate = totalLeads > 0 ? Math.round((bookedMeetings / totalLeads) * 100) : 0;
  const responseRate = totalLeads > 0 ? Math.round((interestedLeads / totalLeads) * 100) : 0;
  
  const totalProjects = projects.length;
  const ongoingProjects = projects.filter(p => p.status === 'Ongoing').length;
  
  const totalCampaigns = campaigns.length;
  const totalCampaignLeads = campaigns.reduce((acc, curr) => acc + curr.leadsGenerated, 0);

  // Chart Data
  const leadStatusData = [
    { name: 'Booked', value: leads.filter(l => l.status === LeadStatus.INTERESTED_BOOKED).length },
    { name: 'Interested', value: leads.filter(l => l.status === LeadStatus.INTERESTED_NOT_BOOKED).length },
    { name: 'Not Interested', value: leads.filter(l => l.status === LeadStatus.NOT_INTERESTED).length },
    { name: 'New', value: leads.filter(l => l.status === LeadStatus.NEW).length },
    { name: 'Follow Up', value: leads.filter(l => l.status === LeadStatus.FOLLOW_UP).length },
  ].filter(d => d.value > 0); // Only show active statuses in chart

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#3b82f6'];

  const campaignPerformance = campaigns.map(c => ({
    name: c.name,
    leads: c.leadsGenerated
  }));

  const handleOpenReport = (report: { id: string, fileName: string }) => {
    const url = fileMap[report.id];
    if (url) {
      window.open(url, '_blank');
    } else {
      alert(`Simulation: Opening "${report.fileName}".\n(No live file in this demo session.)`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Master Overview</h1>
          <p className="text-gray-500">Welcome back, Boss.</p>
        </div>
        <div className="text-sm bg-white px-4 py-2 rounded-lg shadow-sm text-gray-600">
            Current Date: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 font-medium">Total Leads</h3>
            <Users className="text-indigo-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalLeads}</p>
          <p className="text-xs text-green-500 mt-1 flex items-center">+12% from yesterday</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 font-medium">Meetings Booked</h3>
            <PhoneCall className="text-emerald-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{bookedMeetings}</p>
          <p className="text-xs text-gray-400 mt-1">High conversion rate</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 font-medium">Active Campaigns</h3>
            <TrendingUp className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalCampaigns}</p>
          <p className="text-xs text-blue-500 mt-1">{totalCampaignLeads} leads generated</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 font-medium">Ongoing Projects</h3>
            <Code className="text-purple-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{ongoingProjects}</p>
          <p className="text-xs text-gray-400 mt-1">Total {totalProjects} projects</p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sales Performance */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col max-h-[500px]">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Campaign Performance (Sales Manager)</h2>
          <div className="h-48 flex-shrink-0">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leads" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
          <div className="mt-4 border-t pt-4 flex-1 flex flex-col min-h-0">
             <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2 flex justify-between items-center">
                 Daily Reports
                 <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{reports.length} files</span>
             </h4>
             <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
                 <ul className="text-sm space-y-1">
                     {reports.map(r => (
                         <li 
                            key={r.id} 
                            className="text-gray-600 flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer group transition-colors border-b border-gray-50 last:border-0"
                            onClick={() => handleOpenReport(r)}
                         >
                             <span className="flex items-center group-hover:text-indigo-600 truncate">
                                 <span className="truncate max-w-[180px]">{r.fileName}</span>
                                 <ExternalLink size={12} className="ml-2 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                             </span>
                             <span className="text-xs text-gray-400 flex-shrink-0">{r.date}</span>
                         </li>
                     ))}
                     {reports.length === 0 && <li className="text-gray-400 italic text-xs p-2">No reports uploaded yet.</li>}
                 </ul>
             </div>
          </div>
        </div>

        {/* Telecaller Overview */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col h-full">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Lead Status Distribution (Telecaller)</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            {/* Pie Chart */}
            <div className="h-48 sm:h-auto flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <PieChart>
                      <Pie
                        data={leadStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {leadStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
            </div>

            {/* Data Details */}
            <div className="flex flex-col justify-center space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500 mb-1">Conversion</p>
                        <p className="text-xl font-bold text-emerald-600">{conversionRate}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500 mb-1">Response</p>
                        <p className="text-xl font-bold text-blue-600">{responseRate}%</p>
                    </div>
                </div>

                {/* List Breakdown */}
                <div className="space-y-2 border-t border-gray-100 pt-4 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                   {leadStatusData.map((entry, index) => (
                       <div key={entry.name} className="flex justify-between items-center text-xs">
                           <div className="flex items-center text-gray-600">
                               <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                               {entry.name}
                           </div>
                           <span className="font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded">{entry.value}</span>
                       </div>
                   ))}
                   {leadStatusData.length === 0 && <p className="text-xs text-gray-400 text-center">No leads data available.</p>}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Controls */}
      <div className="bg-slate-900 rounded-xl p-8 text-white">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">God Mode Actions</h2>
              <span className="bg-slate-800 px-3 py-1 rounded text-xs text-slate-300">Full Access Granted</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/tech" className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg transition-colors border border-slate-700">
                  <h3 className="font-bold text-indigo-400 mb-1">Manage Tech Projects</h3>
                  <p className="text-xs text-slate-400">Edit milestones, upload docs, move cards.</p>
              </Link>
              <Link to="/telecaller" className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg transition-colors border border-slate-700">
                  <h3 className="font-bold text-indigo-400 mb-1">Audit Leads</h3>
                  <p className="text-xs text-slate-400">Check calls, update status, view hierarchy.</p>
              </Link>
              <Link to="/sales" className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg transition-colors border border-slate-700">
                  <h3 className="font-bold text-indigo-400 mb-1">Campaign Oversight</h3>
                  <p className="text-xs text-slate-400">View daily reports and metrics.</p>
              </Link>
          </div>
      </div>
    </div>
  );
};

export default BossPanel;
