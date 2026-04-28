# 🎓 SeatWise – DSE College Predictor

SeatWise is a web-based application that helps Diploma students predict eligible engineering colleges for **Direct Second Year (DSE) admissions** based on their **percentile/rank and preferences**.

It provides accurate, fast, and user-friendly filtering using previous year cutoff data.

---

## 🚀 Features

- 🔍 Predict colleges based on:
  - Percentile or Rank
  - Branch (Computer, IT, etc.)
  - Seat Type (OPEN, OBC, etc.)
  - College Type (Government, Aided, Unaided)
  - Region (Pune, Mumbai, Nagpur, etc.)

- 📊 Smart filtering with real cutoff data  
- 📄 Export results as **PDF**  
- ⚡ Fully client-side (No backend required)  
- 🎯 Fast and responsive UI  

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Libraries Used:**
  - [Choices.js] – Enhanced dropdowns  
  - [Font Awesome] – Icons  
  - [jsPDF + AutoTable] – PDF generation  

- **Data Format:** JSON  

---

## 📂 Project Structure
📁 SeatWise
│── index.html # Main UI
│── style.css # Styling
│── script.js # Application logic
│── Engineering-College-List.json # College & cutoff data
│── README.md
│── LICENSE

---

## ⚙️ How It Works

1. User enters:
   - Percentile or Rank  
   - Preferences (branch, seat type, etc.)

2. System:
   - Matches input with cutoff dataset  
   - Filters eligible colleges  

3. Output:
   - Displays list of colleges  
   - Allows PDF download  

---

## 📊 Data Source

- MHT-CET DSE CAP Round cutoff data  
- Converted from PDF to structured JSON format  

> ⚠️ Note: Results are based on previous year data and are for reference only.

---

## 🖥️ How to Run Locally

```bash
# Clone repository
git clone https://github.com/your-username/SeatWise.git

# Open folder
cd SeatWise

# Run
Open index.html in your browser
