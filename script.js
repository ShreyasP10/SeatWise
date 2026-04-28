// ============================================================
// MHT-CET College Predictor - Main Script
// ============================================================

// Global variables
let excelData = [];
let filteredData = [];
let originalFilteredData = [];
const resultsPerPage = 20;
let currentPage = 1;
let totalPages = 1;
let seatChoices, branchChoices, collegeChoices, regionChoices;
let allBranchesList = [];

// Helper: Determine college type from institute name
function getCollegeTypeFromInstitute(name) {
  if (!name) return "Other";
  const lower = name.toLowerCase();
  if (lower.includes("government") && lower.includes("autonomous"))
    return "Government‑Autonomous";
  if (lower.includes("government")) return "Government";
  if (lower.includes("autonomous")) return "Autonomous";
  if (lower.includes("aided")) return "Aided";
  if (lower.includes("unaided")) return "Unaided";
  return "Other";
}

// Region mapping: region name -> first digit of institute code
const regionPrefixMap = {
  Amravati: "1",
  Sambhajinagar: "2",
  Mumbai: "3",
  Nagpur: "4",
  Nashik: "5",
  Pune: "6"
};

// Unified selection helper (handles "ALL_BRANCHES" for branch dropdown)
function getSelectedValues(instance, isBranch = false) {
  const selected = instance.getValue(true);
  if (!selected || selected.length === 0) return [];
  if (isBranch && selected.includes("ALL_BRANCHES")) {
    return [...allBranchesList];
  }
  return selected;
}

// Toast notification
function showNotification(message, type = "error") {
  const notif = document.getElementById("notification");
  if (!notif) return;
  notif.querySelector("span").textContent = message;
  notif.className = `notification ${type} show`;
  setTimeout(() => {
    notif.className = "notification";
  }, 5000);
}

// Show/hide loading spinner
function showLoading(show) {
  let loader = document.querySelector(".loading");
  if (show) {
    if (!loader) {
      const div = document.createElement("div");
      div.className = "loading";
      div.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading colleges...';
      document.body.appendChild(div);
    }
  } else {
    if (loader) loader.remove();
  }
}

// Initialize Choices.js dropdowns
function initDropdowns() {
  seatChoices = new Choices("#seatType", {
    removeItemButton: true,
    placeholder: true,
    placeholderValue: "Choose seat types"
  });
  branchChoices = new Choices("#branch", {
    removeItemButton: true,
    placeholder: true,
    placeholderValue: "Choose branches",
    searchEnabled: true,
    searchPlaceholderValue: "Search branches...",
    shouldSort: false
  });
  collegeChoices = new Choices("#collegeType", {
    removeItemButton: true,
    placeholder: true,
    placeholderValue: "Choose college types"
  });
  regionChoices = new Choices("#region", {
    removeItemButton: true,
    placeholder: true,
    placeholderValue: "Select region(s)"
  });

  regionChoices.setChoices(
    Object.keys(regionPrefixMap).map((r) => ({ value: r, label: r })),
    "value",
    "label",
    true
  );
}

// Populate dropdowns from loaded data
function populateDropdowns(data) {
  const seatTypes = [...new Set(data.map((d) => d["Seat Type"]).filter(Boolean))];
  seatChoices.setChoices(
    seatTypes.map((s) => ({ value: s, label: s })),
    "value",
    "label",
    true
  );

  const branches = [...new Set(data.map((d) => d["Branch"]).filter(Boolean))];
  branches.sort();
  allBranchesList = [...branches];
  const branchOptions = [
    { value: "ALL_BRANCHES", label: "✨ All Branches" },
    ...branches.map((b) => ({ value: b, label: b }))
  ];
  branchChoices.setChoices(branchOptions, "value", "label", true);

  const collegeTypes = [
    ...new Set(data.map((d) => getCollegeTypeFromInstitute(d["Institute"])))
  ];
  collegeChoices.setChoices(
    collegeTypes.map((c) => ({ value: c, label: c })),
    "value",
    "label",
    true
  );
}

// Main filtering logic
function filterData() {
  const regions = getSelectedValues(regionChoices, false);
  const seatTypes = getSelectedValues(seatChoices, false);
  const branches = getSelectedValues(branchChoices, true);
  const collegeTypes = getSelectedValues(collegeChoices, false);
  const predictType = document.querySelector('input[name="predictType"]:checked').value;
  const inputValue = parseFloat(document.getElementById("inputValue").value);
  const collegeCount = document.getElementById("collegeCount").value;

  if (isNaN(inputValue)) {
    showNotification("Please enter a valid percentile or rank");
    return null;
  }
  if (predictType === "percentile" && (inputValue < 0 || inputValue > 100)) {
    showNotification("Percentile must be between 0 and 100");
    return null;
  }

  let filtered = [...excelData];

  if (seatTypes.length) {
    filtered = filtered.filter((d) => seatTypes.includes(d["Seat Type"]));
  }
  if (branches.length) {
    filtered = filtered.filter((d) => branches.includes(d["Branch"]));
  }
  if (collegeTypes.length) {
    filtered = filtered.filter((d) =>
      collegeTypes.includes(getCollegeTypeFromInstitute(d["Institute"]))
    );
  }

  if (predictType === "rank") {
    filtered = filtered.filter((d) => d["Rank"] && inputValue <= d["Rank"]);
  } else {
    filtered = filtered.filter((d) => d["Percentile"] && inputValue >= d["Percentile"]);
  }

  // Region filter: match first digit of institute code
  if (regions.length) {
    filtered = filtered.filter((d) => {
      const code = String(d["Institute Code"] || "");
      const firstDigit = code.charAt(0);
      return regions.some((region) => regionPrefixMap[region] === firstDigit);
    });
  }

  // Sort by percentile descending (best match first)
  filtered.sort((a, b) => (b["Percentile"] || 0) - (a["Percentile"] || 0));

  if (collegeCount !== "all") {
    filtered = filtered.slice(0, parseInt(collegeCount, 10));
  }

  return filtered;
}

// Display selected filter criteria in results page
function displaySearchParams() {
  const container = document.getElementById("searchParams");
  if (!container) return;
  container.innerHTML = "";

  const params = [
    { label: "Region", value: getSelectedValues(regionChoices, false).join(", ") || "All" },
    { label: "Seat Type", value: getSelectedValues(seatChoices, false).join(", ") || "All" },
    { label: "Branch", value: getSelectedValues(branchChoices, true).join(", ") || "All" },
    { label: "College Type", value: getSelectedValues(collegeChoices, false).join(", ") || "All" }
  ];

  const predictType = document.querySelector('input[name="predictType"]:checked').value;
  params.push({ label: "Filter By", value: predictType === "percentile" ? "Percentile" : "Rank" });
  params.push({
    label: predictType === "percentile" ? "Percentile" : "Rank",
    value: document.getElementById("inputValue").value
  });

  params.forEach((p) => {
    const div = document.createElement("div");
    div.className = "param-card";
    div.innerHTML = `<h3>${p.label}</h3><span>${p.value}</span>`;
    container.appendChild(div);
  });
}

// Render paginated results table
function displayResults(page = 1) {
  currentPage = page;
  const start = (page - 1) * resultsPerPage;
  const end = Math.min(start + resultsPerPage, filteredData.length);
  const slice = filteredData.slice(start, end);

  const body = document.getElementById("resultsBody");
  if (!body) return;
  body.innerHTML = "";
  if (slice.length === 0) {
    body.innerHTML = '<tr><td colspan="6">No colleges found</td></tr>';
  } else {
    slice.forEach((d) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d["Institute"] || "N/A"}</td>
        <td>${d["Branch"] || "N/A"}</td>
        <td>${getCollegeTypeFromInstitute(d["Institute"])}</td>
        <td>${d["Seat Type"] || "N/A"}</td>
        <td>${d["Rank"] ?? "N/A"}</td>
        <td>${d["Percentile"] ?? "N/A"}</td>
      `;
      body.appendChild(tr);
    });
  }

  totalPages = Math.ceil(filteredData.length / resultsPerPage);
  const totalSpan = document.getElementById("totalResultsSpan");
  if (totalSpan) totalSpan.textContent = filteredData.length;

  renderPagination();

  // Update stats summary
  const govCount = filteredData.filter(
    (d) => getCollegeTypeFromInstitute(d["Institute"]).includes("Government")
  ).length;
  const statsDiv = document.getElementById("statsInfo");
  if (statsDiv) {
    statsDiv.innerHTML = `🏛️ Total Colleges: ${filteredData.length} | 🏢 Govt: ${govCount} | 🏫 Others: ${filteredData.length - govCount}`;
  }
}

// Build pagination buttons
function renderPagination() {
  const container = document.getElementById("pagination");
  if (!container) return;
  container.innerHTML = "";
  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "‹";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => displayResults(currentPage - 1);
  container.appendChild(prevBtn);

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.onclick = () => displayResults(i);
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "›";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => displayResults(currentPage + 1);
  container.appendChild(nextBtn);
}

// Export visible results to PDF
function downloadPDF() {
  if (!filteredData.length) {
    showNotification("No data to export", "info");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("MHT-CET College Predictor Report", 14, 18);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  const headers = [["Institute", "Branch", "College Type", "Seat Type", "Rank", "Percentile"]];
  const body = filteredData.map((r) => [
    r["Institute"] || "N/A",
    r["Branch"] || "N/A",
    getCollegeTypeFromInstitute(r["Institute"]),
    r["Seat Type"] || "N/A",
    r["Rank"] ?? "N/A",
    r["Percentile"] ?? "N/A"
  ]);

  doc.autoTable({
    startY: 35,
    head: headers,
    body: body,
    theme: "striped",
    headStyles: { fillColor: [41, 112, 128], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  doc.save("College_Predictor_Results.pdf");
}

// Live search within displayed results
function searchResults() {
  const term = document.getElementById("searchResults").value.toLowerCase().trim();
  if (!term) {
    filteredData = [...originalFilteredData];
  } else {
    filteredData = originalFilteredData.filter(
      (d) =>
        (d["Institute"]?.toLowerCase().includes(term) ||
          d["Branch"]?.toLowerCase().includes(term) ||
          d["Seat Type"]?.toLowerCase().includes(term))
    );
  }
  currentPage = 1;
  displayResults();
}

// Sort results based on dropdown selection
function sortResults() {
  const sortMode = document.getElementById("sortSelect").value;
  if (!filteredData.length) return;
  if (sortMode === "percentile-desc") {
    filteredData.sort((a, b) => (b["Percentile"] || 0) - (a["Percentile"] || 0));
  } else if (sortMode === "rank-asc") {
    filteredData.sort((a, b) => (a["Rank"] || Infinity) - (b["Rank"] || Infinity));
  }
  currentPage = 1;
  displayResults();
}

// Save current filter preferences to localStorage
function savePreferences() {
  const prefs = {
    seat: seatChoices.getValue(true),
    branch: branchChoices.getValue(true),
    college: collegeChoices.getValue(true),
    region: regionChoices.getValue(true)
  };
  localStorage.setItem("seatwise_prefs", JSON.stringify(prefs));
}

// Load preferences from localStorage
function loadPreferences() {
  const prefs = JSON.parse(localStorage.getItem("seatwise_prefs"));
  if (!prefs) return;
  try {
    if (prefs.seat) seatChoices.setChoiceByValue(prefs.seat);
    if (prefs.branch) branchChoices.setChoiceByValue(prefs.branch);
    if (prefs.college) collegeChoices.setChoiceByValue(prefs.college);
    if (prefs.region) regionChoices.setChoiceByValue(prefs.region);
  } catch (e) {
    console.warn("Could not restore all preferences", e);
  }
}

// Reset all filters and return to form view
function resetForm() {
  document.getElementById("predictorForm").reset();
  document.getElementById("inputValue").value = "";
  document.querySelector('input[value="percentile"]').checked = true;
  const inputLabel = document.getElementById("inputLabel");
  if (inputLabel) inputLabel.innerText = "Enter Percentile:";

  seatChoices.clearStore();
  branchChoices.clearStore();
  collegeChoices.clearStore();
  regionChoices.clearStore();
  populateDropdowns(excelData);

  const formCard = document.getElementById("formCard");
  const resultsContainer = document.getElementById("resultsContainer");
  if (formCard) formCard.style.display = "block";
  if (resultsContainer) resultsContainer.style.display = "none";

  const searchInput = document.getElementById("searchResults");
  if (searchInput) searchInput.value = "";
  originalFilteredData = [];
  filteredData = [];
  savePreferences();
}

// Initialize the application – load data and set up event listeners
async function initApp() {
  // Wait for DOM to be fully loaded (safe)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
    return;
  }

  initDropdowns();
  showLoading(true);

  try {
    const res = await fetch("Engineering-College-List.json");
    if (!res.ok) throw new Error("Network response failed");
    const json = await res.json();
    excelData = json["MHT-CET College Data"] || [];
    if (!excelData.length) throw new Error("Empty dataset");
    populateDropdowns(excelData);
    showLoading(false);

    loadPreferences();

    // Attach event listeners – with existence checks
    const predictBtn = document.getElementById("predictButton");
    if (predictBtn) {
      predictBtn.addEventListener("click", () => {
        const filtered = filterData();
        if (filtered && filtered.length) {
          filteredData = filtered;
          originalFilteredData = [...filteredData];
          const formCard = document.getElementById("formCard");
          const resultsContainer = document.getElementById("resultsContainer");
          if (formCard) formCard.style.display = "none";
          if (resultsContainer) resultsContainer.style.display = "block";
          displaySearchParams();
          displayResults();
          savePreferences();
        } else {
          showNotification("No colleges found matching your criteria", "info");
        }
      });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) resetBtn.addEventListener("click", resetForm);

    const downloadBtn = document.getElementById("downloadPdfBtn");
    if (downloadBtn) downloadBtn.addEventListener("click", downloadPDF);

    const clearSearchBtn = document.getElementById("clearSearch");
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        const searchInput = document.getElementById("searchResults");
        if (searchInput) searchInput.value = "";
        searchResults();
      });
    }

    const searchInput = document.getElementById("searchResults");
    if (searchInput) searchInput.addEventListener("input", searchResults);

    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) sortSelect.addEventListener("change", sortResults);

    const radioButtons = document.querySelectorAll('input[name="predictType"]');
    radioButtons.forEach((input) => {
      input.addEventListener("change", function () {
        const label = document.getElementById("inputLabel");
        if (label) {
          label.innerText = this.value === "percentile" ? "Enter Percentile:" : "Enter Rank:";
        }
      });
    });
  } catch (err) {
    console.error(err);
    showLoading(false);
    showNotification("Failed to load college data. Please check the JSON file.", "error");
  }
}

// Start the app
initApp();