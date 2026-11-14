function main(workbook: ExcelScript.Workbook, leadJson: string = "") {
  const headers = [
    "Submitted (GST)",
    "Reference",
    "Status",
    "Parent",
    "WhatsApp",
    "Child age",
    "Area",
    "Wants to start",
    "Started from",
    "Skipped questions",
    "Profile",
    "Summary",
    "What stood out",
    "Answers",
    "Session",
    "Minutes",
    "Notes",
  ];

  const sheets = workbook.getWorksheets();
  const sheet =
    sheets.find((worksheet) => worksheet.getTables().some((table) => table.getName() === "Leads")) ??
    workbook.getWorksheet("Sheet1") ??
    workbook.getWorksheet("Leads") ??
    sheets[0] ??
    workbook.addWorksheet("Sheet1");
  let table = sheet.getTable("Leads");
  if (!table) {
    const header = sheet.getRangeByIndexes(0, 0, 1, headers.length);
    header.setValues([headers]);
    header.getFormat().getFill().setColor("#113B24");
    header.getFormat().getFont().setColor("#FFFFFF");
    header.getFormat().getFont().setBold(true);
    sheet.getFreezePanes().freezeRows(1);
    table = sheet.addTable(header.getAddress(), true);
    table.setName("Leads");
    const widths = [22, 14, 18, 22, 20, 12, 16, 24, 42, 18, 22, 46, 42, 55, 28, 12, 28];
    widths.forEach((width, index) => sheet.getRangeByIndexes(0, index, 1, 1).getFormat().setColumnWidth(width));
    sheet.getRange("C2:C5000").getDataValidation().setRule({
      list: { inCellDropDown: true, source: "New,Contacted,Confirmed,Completed,Not proceeding" },
    });
  }

  if (!leadJson.trim()) return "Ready for new leads.";

  const lead = JSON.parse(leadJson) as (string | number)[];
  const reference = String(lead[1] || "");
  if (reference && table.getRowCount() > 0) {
    const seen = table
      .getColumnByName("Reference")
      .getRangeBetweenHeaderAndTotal()
      .getValues()
      .some((row) => String(row[0]) === reference);
    if (seen) return "Already tracked.";
  }

  table.addRow(-1, lead);
  const lastRow = table.getRowCount() + 1;
  sheet.getRange(`L${lastRow}:N${lastRow}`).getFormat().setWrapText(true);
  return `Added ${reference}`;
}
