import { useCallback, useEffect, useState } from "react";
import AdminAccessGate from "../components/admin/AdminAccessGate";
import ReportCard from "../components/admin/ReportCard";
import { useAuth } from "../context/auth-context";
import { api } from "../services/api";
import { adminSessionKey } from "../services/adminSession";

const filters = [
  ["pending", "Pending"],
  ["resolved", "Resolved"],
  ["dismissed", "Dismissed"],
  ["content_deleted", "Content deleted"],
  ["all", "All"],
];

export default function Admin() {
  const { user } = useAuth();
  const [adminSession, setAdminSession] = useState("");
  const [filter, setFilter] = useState("pending");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const unlock = useCallback((sessionToken) => {
    setLoading(true);
    setError("");
    setAdminSession(sessionToken);
  }, []);

  useEffect(() => {
    if (!adminSession) return undefined;
    let active = true;
    user
      .getIdToken()
      .then((token) => api.getReports(token, filter, adminSession))
      .then((items) => {
        if (!active) return;
        setReports(items);
        setError("");
      })
      .catch((loadError) => {
        if (!active) return;
        if (loadError.status === 403) {
          sessionStorage.removeItem(adminSessionKey(user.uid));
          setAdminSession("");
        }
        setError(loadError.message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [adminSession, filter, user]);

  function changeFilter(value) {
    setLoading(true);
    setError("");
    setFilter(value);
  }

  async function updateStatus(reportId, status) {
    setBusyId(reportId);
    setError("");
    try {
      const token = await user.getIdToken();
      const updated = await api.updateReportStatus(
        token,
        reportId,
        status,
        adminSession,
      );
      if (filter === "all" || filter === status) {
        setReports((items) =>
          items.map((item) => (item.id === reportId ? updated : item)),
        );
      } else {
        setReports((items) => items.filter((item) => item.id !== reportId));
      }
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusyId("");
    }
  }

  async function removeContent(report) {
    const targetType = report.targetType || "post";
    if (
      !window.confirm(
        `Delete this ${targetType} permanently? The report and admin audit log will remain.`,
      )
    ) {
      return;
    }
    setBusyId(report.id);
    setError("");
    try {
      const token = await user.getIdToken();
      const updated = await api.deleteReportedContent(
        token,
        report.id,
        adminSession,
      );
      if (filter === "all" || filter === "content_deleted") {
        setReports((items) =>
          items.map((item) => (item.id === report.id ? updated : item)),
        );
      } else {
        setReports((items) => items.filter((item) => item.id !== report.id));
      }
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusyId("");
    }
  }

  async function lockPanel() {
    const currentSession = adminSession;
    sessionStorage.removeItem(adminSessionKey(user.uid));
    setAdminSession("");
    setReports([]);
    try {
      await api.lockAdmin(await user.getIdToken(), currentSession);
    } catch {
      // The local session is already removed, so the panel remains locked.
    }
  }

  if (!adminSession) {
    return <AdminAccessGate user={user} onUnlocked={unlock} />;
  }

  return (
    <section className="mx-auto min-h-[70vh] w-[min(1100px,calc(100%_-_40px))] py-12">
      <header className="mb-8 border-b border-neutral-700 pb-7">
        <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-500">
          ADMINISTRATIVE ORBIT / MODERATION
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl tracking-[-1.5px]">Report control.</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Review community reports and record moderation decisions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="border border-neutral-700 px-3 py-2 font-mono text-[9px] text-neutral-400">
              {loading ? "SCANNING" : `${reports.length} SIGNALS`}
            </span>
            <button
              className="border border-neutral-700 px-3 py-2 font-mono text-[9px] text-neutral-400 uppercase hover:border-white hover:text-white"
              type="button"
              onClick={lockPanel}
            >
              Lock panel
            </button>
          </div>
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Report filters">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`min-h-10 border px-4 font-mono text-[8px] uppercase ${filter === value ? "border-white bg-white text-black" : "border-neutral-700 text-neutral-400 hover:border-white hover:text-white"}`}
            onClick={() => changeFilter(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && (
        <p className="mb-5 border border-red-950 bg-red-950/20 p-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <p className="py-20 text-center font-mono text-[9px] text-neutral-500">
          RETRIEVING MODERATION SIGNALS...
        </p>
      )}
      {!loading && !reports.length && (
        <div className="border border-neutral-800 py-20 text-center">
          <span className="text-3xl text-neutral-700">✦</span>
          <p className="mt-4 text-sm text-neutral-500">
            No reports in this sector.
          </p>
        </div>
      )}
      {!loading && reports.length > 0 && (
        <div className="space-y-5">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              busy={busyId === report.id}
              onStatus={updateStatus}
              onDeleteContent={removeContent}
            />
          ))}
        </div>
      )}
    </section>
  );
}
