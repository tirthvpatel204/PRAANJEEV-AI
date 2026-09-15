import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileText,
  UserCheck,
  Search,
  Filter,
} from 'lucide-react';
import { Hospital, AuditLog, VerificationStatus } from '../types.js';

interface AdminDashboardProps {
  hospitals: Hospital[];
  auditLogs: AuditLog[];
  onUpdateVerification: (hospitalId: string, status: VerificationStatus, reason: string) => Promise<void>;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  hospitals,
  auditLogs,
  onUpdateVerification,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const totalHospitals = hospitals.length;
  const verifiedCount = hospitals.filter((h) => h.verificationStatus === 'VERIFIED').length;
  const pendingCount = hospitals.filter((h) => h.verificationStatus === 'PENDING').length;
  const suspendedCount = hospitals.filter((h) => h.verificationStatus === 'SUSPENDED').length;

  const staleHospitals = hospitals.filter((h) => h.dataConfidence === 'LOW');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType !== 'ALL' && log.entityType !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Verification Metric Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>National Health Registry & System Oversight</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white font-display">
              Hospital Trust, Verification & Audit Governance
            </h2>
            <p className="text-xs text-slate-400">
              Only verified hospitals receive emergency cases. Unverified or suspended entities are strictly blocked from AI matching.
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Sync Audit Logs</span>
          </button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Registry</span>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">{totalHospitals}</div>
            <span className="text-[10px] text-slate-500">Registered Centers</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40">
            <span className="text-xs text-emerald-400 uppercase font-semibold">Verified Active</span>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">{verifiedCount}</div>
            <span className="text-[10px] text-slate-500">NABH & Govt Approved</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/40">
            <span className="text-xs text-amber-400 uppercase font-semibold">Pending Review</span>
            <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">{pendingCount}</div>
            <span className="text-[10px] text-slate-500">Awaiting Documents</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/40">
            <span className="text-xs text-rose-400 uppercase font-semibold">Suspended</span>
            <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">{suspendedCount}</div>
            <span className="text-[10px] text-slate-500">Blocked from Routing</span>
          </div>
        </div>
      </div>

      {/* Freshness & Stale Anomaly Alert (Section 10 & 23) */}
      {staleHospitals.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 flex items-start space-x-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-1">
              Hourly Freshness Anomaly Alert: {staleHospitals.length} Hospital(s) Exceeded Update Threshold
            </strong>
            <p className="leading-relaxed">
              {staleHospitals.map((h) => h.name).join(', ')} have not updated resources for more than 4 hours. Data confidence downgraded to <span className="font-bold text-amber-400">LOW</span> and AI suitability scores penalized in routing calculations.
            </p>
          </div>
        </div>
      )}

      {/* Hospital Vetting & Compliance Directory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white font-display flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span>Hospital Verification Management & Regulatory Status</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Hospital Name</th>
                <th className="py-3 px-3">City / Area</th>
                <th className="py-3 px-3">Registration & Accreditation</th>
                <th className="py-3 px-3">Hourly Freshness</th>
                <th className="py-3 px-3">Current Status</th>
                <th className="py-3 px-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {hospitals.map((h) => (
                <tr key={h.id} className="hover:bg-slate-950/50">
                  <td className="py-3 px-3">
                    <strong className="text-white block">{h.name}</strong>
                    <span className="text-[11px] text-slate-400">{h.address}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {h.city}, {h.country}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <span className="font-mono text-cyan-300">{h.registrationNumber}</span>
                    <span className="block text-[10px] text-slate-400">{h.accreditation}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      h.dataConfidence === 'HIGH'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {h.dataConfidence} CONFIDENCE
                    </span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                      {new Date(h.lastResourceUpdate).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {h.verificationStatus === 'VERIFIED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center space-x-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>VERIFIED</span>
                      </span>
                    ) : h.verificationStatus === 'SUSPENDED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700 flex items-center space-x-1 w-fit">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        <span>SUSPENDED</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700 flex items-center space-x-1 w-fit">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>PENDING</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {h.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() =>
                            onUpdateVerification(h.id, 'VERIFIED', 'All license documents and inspection verified by State Directorate')
                          }
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition"
                        >
                          Verify & Activate
                        </button>
                      )}
                      {h.verificationStatus !== 'SUSPENDED' && (
                        <button
                          onClick={() =>
                            onUpdateVerification(h.id, 'SUSPENDED', 'Administrative compliance suspension due to license audit')
                          }
                          className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-[11px] transition"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable System Audit Trail (Section 24) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Immutable System Audit Trail & Compliance Log</span>
            </h3>
            <p className="text-xs text-slate-400">
              Full trace of all emergency cases, resource changes, anomaly blocks, and hospital verifications.
            </p>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="EMERGENCY_CASE">Emergency Cases</option>
              <option value="RESOURCE">Resource Updates</option>
              <option value="VERIFICATION">Verifications</option>
              <option value="HOSPITAL">Hospitals</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Actor / Role</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLogs.map((log) => {
                const isAnomaly = log.action.includes('ANOMALY') || log.action.includes('SUSPENDED');
                return (
                  <tr key={log.id} className={`hover:bg-slate-950/60 ${isAnomaly ? 'bg-rose-950/20' : ''}`}>
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold font-mono text-[11px] ${
                        isAnomaly ? 'text-rose-400' : 'text-cyan-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <strong>{log.performedBy}</strong>
                      <span className="text-[10px] text-slate-500 block">({log.role})</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      <div>{log.details}</div>
                      {log.reason && (
                        <span className="text-[10px] text-slate-400 italic block">
                          Reason: {log.reason}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
