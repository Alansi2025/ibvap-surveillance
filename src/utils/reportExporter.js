/**
 * Report Exporter for IBVAP Border Command
 * Generates formatted CSV and JSON intelligence summary reports.
 */

export function exportIncidentsToCSV(incidents) {
  if (!incidents || incidents.length === 0) {
    console.warn("[IBVAP] No incident log records available to export.");
    return;
  }

  const headers = ["Event ID", "Timestamp", "Camera / Sector", "Severity", "Category", "Target Class", "Confidence", "Description", "Status"];
  const rows = incidents.map(item => [
    `"${item.event_id || item.id || ''}"`,
    `"${item.timestamp || ''}"`,
    `"${item.camera_id || item.camera || ''}"`,
    `"${item.severity || ''}"`,
    `"${item.category || item.type || ''}"`,
    `"${item.target_class || ''}"`,
    `"${item.confidence ? Math.round(item.confidence * 100) + '%' : ''}"`,
    `"${(item.description || item.title || '').replace(/"/g, '""')}"`,
    `"${item.status || ''}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `IBVAP_Border_Surveillance_Incident_Log_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportIntelligenceSummaryJSON(incidents, watchlistFRS = [], watchlistANPR = []) {
  const summaryData = {
    platform: "IBVAP - Intelligent Border Video Analytics Platform",
    generatedAt: new Date().toISOString(),
    totalIncidents: incidents.length,
    threatBreakdown: {
      CRITICAL: incidents.filter(i => (i.severity || '').toUpperCase() === 'CRITICAL').length,
      HIGH: incidents.filter(i => (i.severity || '').toUpperCase() === 'HIGH').length,
      WARNING: incidents.filter(i => (i.severity || '').toUpperCase() === 'WARNING').length,
      INFO: incidents.filter(i => (i.severity || '').toUpperCase() === 'INFO').length,
    },
    watchlistMetrics: {
      enrolledFRSSuspects: watchlistFRS.length,
      registeredANPRPlates: watchlistANPR.length
    },
    incidents: incidents
  };

  const jsonContent = JSON.stringify(summaryData, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `IBVAP_Intelligence_Briefing_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
