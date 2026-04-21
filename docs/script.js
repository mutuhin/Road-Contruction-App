const DATABASE_KEY = 'roadConstructionFinanceDB';

const fmtTaka = n => '৳\u00a0' + Math.abs(Number(n)).toLocaleString(undefined, { maximumFractionDigits: 2 });

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateDashboard();

    // Labour form
    document.getElementById('labourForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('labourName').value.trim();
        const date = document.getElementById('labourDate').value;
        const money = parseFloat(document.getElementById('labourMoney').value);
        if (!name || !date || isNaN(money) || money <= 0) {
            alert('সঠিক তথ্য দিন।');
            return;
        }
        addLabour(name, date, money);
        this.reset();
    });

    // Material form
    const billInput = document.getElementById('billAmount');
    const paidInput = document.getElementById('paidAmount');
    const dueInput = document.getElementById('dueAmount');
    const matPaymentTypeInput = document.getElementById('materialPaymentType');
    const matPaymentRefInput = document.getElementById('materialPaymentRef');

    function updateDue() {
        const bill = parseFloat(billInput.value) || 0;
        const paid = parseFloat(paidInput.value) || 0;
        dueInput.value = calculateDue(bill, paid).toFixed(2);
    }

    function updateMatRefPlaceholder() {
        matPaymentRefInput.placeholder = matPaymentTypeInput.value === 'bank'
            ? 'Cheque/NPSB/Number'
            : 'Optional for cash';
    }

    billInput.addEventListener('input', updateDue);
    paidInput.addEventListener('input', updateDue);
    matPaymentTypeInput.addEventListener('change', updateMatRefPlaceholder);

    document.getElementById('materialForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const buyer = document.getElementById('buyerName').value.trim();
        const materialName = document.getElementById('materialName').value.trim();
        const date = document.getElementById('materialDate').value;
        const bill = parseFloat(document.getElementById('billAmount').value);
        const quantity = document.getElementById('quantity').value.trim();
        const paid = parseFloat(document.getElementById('paidAmount').value);
        const due = calculateDue(bill, paid);
        const paymentType = matPaymentTypeInput.value;
        const paymentRef = matPaymentRefInput.value.trim();
        if (!buyer || !materialName || !date || isNaN(bill) || bill < 0 || !quantity || isNaN(paid) || paid < 0 || paid > bill) {
            alert('সঠিক তথ্য দিন। পরিশোধিত পরিমাণ বিলের চেয়ে বেশি হতে পারবে না।');
            return;
        }
        if (paid > 0 && paymentType === 'bank' && !paymentRef) {
            alert('ব্যাংক ট্রান্সফারের জন্য রেফারেন্স নম্বর দিন।');
            return;
        }
        addMaterial(buyer, materialName, date, bill, quantity, paid, due, paymentType, paymentRef);
        this.reset();
        dueInput.value = '';
        updateMatRefPlaceholder();
    });


    // Engineer form
    document.getElementById('engineerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('engineerName').value;
        const date = document.getElementById('engineerDate').value;
        const amount = parseFloat(document.getElementById('engineerAmount').value);
        const paymentType = document.getElementById('engineerPaymentType').value;        if (!name || !date || isNaN(amount) || amount <= 0) {
            alert('সঠিক তথ্য দিন।');
            return;
        }        addEngineer(name, date, amount, paymentType);
        this.reset();
    });

    // Expense form
    document.getElementById('expenseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const description = document.getElementById('expenseDescription').value;
        const date = document.getElementById('expenseDate').value;
        const amount = parseFloat(document.getElementById('expenseAmount').value);        if (!description || !date || isNaN(amount) || amount <= 0) {
            alert('সঠিক তথ্য দিন।');
            return;
        }        addExpense(description, date, amount);
        this.reset();
    });

    // Export button → open modal
    document.getElementById('exportDataBtn').addEventListener('click', () => {
        document.getElementById('exportModal').classList.remove('hidden');
    });
    document.getElementById('closeExportModal').addEventListener('click', () => {
        document.getElementById('exportModal').classList.add('hidden');
    });
    document.getElementById('exportModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('exportModal'))
            document.getElementById('exportModal').classList.add('hidden');
    });

    // Format toggle buttons
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    document.getElementById('doExportBtn').addEventListener('click', runExport);

    // Got Bill (Received from Govt) form
    document.getElementById('gotBillForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const description = document.getElementById('gotBillDesc').value.trim();
        const amount = parseFloat(document.getElementById('gotBillAmount').value);
        const date   = document.getElementById('gotBillDate').value;
        if (!date || isNaN(amount) || amount <= 0) {
            alert('সঠিক পরিমাণ ও তারিখ দিন।');
            return;
        }
        data.govtReceived.push({ description: description || 'Received', amount, date });
        saveData();
        displayGotBills();
        updateDashboard();
        this.reset();
    });

    // Cash In form
    document.getElementById('cashForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const description = document.getElementById('cashDescription').value.trim();
        const amount = parseFloat(document.getElementById('cashAmount').value);
        const date   = document.getElementById('cashDate').value;
        if (!description || !date || isNaN(amount) || amount <= 0) {
            alert('সঠিক তথ্য দিন।');
            return;
        }
        data.cashIn.push({ description, amount, date });
        saveData();
        displayCash();
        updateDashboard();
        this.reset();
    });

    // Contract form
    document.getElementById('contractForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name   = document.getElementById('contractName').value.trim();
        const amount = parseFloat(document.getElementById('contractAmount').value);
        const date   = document.getElementById('contractDate').value;
        const note   = document.getElementById('contractNote').value.trim();
        if (!name || !date || isNaN(amount) || amount <= 0) {
            alert('সঠিক তথ্য দিন।');
            return;
        }
        data.contracts.push({ name, amount, date, note });
        saveData();
        displayContracts();
        updateDashboard();
        this.reset();
    });

    // Tender auto-calculate
    const billCatEl        = document.getElementById('billCategory');
    const tenderValueGroup = document.getElementById('tenderValueGroup');
    const tenderPctGroup   = document.getElementById('tenderPctGroup');
    const tenderValueEl    = document.getElementById('tenderValue');
    const tenderPctEl      = document.getElementById('tenderPct');
    const billAmtEl        = document.getElementById('billAmountInput');

    function updateBillForm() {
        const cat = billCatEl.value;
        const hasCalc = cat === 'tender' || cat === 'govt' || cat === 'lged';
        tenderValueGroup.classList.toggle('hidden', !hasCalc);
        tenderPctGroup.classList.toggle('hidden', !hasCalc);
        billAmtEl.readOnly = hasCalc;
        if (!hasCalc) { billAmtEl.readOnly = false; billAmtEl.value = ''; tenderValueEl.value = ''; tenderPctEl.value = ''; }
        const lbl = document.getElementById('tenderValueLabel');
        if (lbl) lbl.textContent = cat === 'tender' ? 'টেন্ডার মূল্য (৳)' : 'মূল মান (৳)';
        calcTenderAmt();
    }
    function calcTenderAmt() {
        const cat = billCatEl.value;
        if (cat !== 'tender' && cat !== 'govt' && cat !== 'lged') return;
        const v = parseFloat(tenderValueEl.value) || 0;
        const p = parseFloat(tenderPctEl.value) || 0;
        billAmtEl.value = (v - (v * p / 100)).toFixed(2);
    }
    billCatEl.addEventListener('change', updateBillForm);
    tenderValueEl.addEventListener('input', calcTenderAmt);
    tenderPctEl.addEventListener('input', calcTenderAmt);
    // Set default to Govt Fees (no percentage fields shown)
    billCatEl.value = 'govt';
    updateBillForm();

    // Bills to Pay form
    document.getElementById('billForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const cat         = document.getElementById('billCategory').value;
        const party       = document.getElementById('billPartyInput').value.trim();
        const description = document.getElementById('billDescription').value.trim();
        const amount      = parseFloat(document.getElementById('billAmountInput').value);
        const dueDate     = document.getElementById('billDueDate').value;
        if (!description || !amount || !dueDate) {
            alert('সব প্রয়োজনীয় তথ্য পূরণ করুন।');
            return;
        }
        const entry = { cat, party, description, amount, dueDate, status: 'pending', created: new Date().toISOString().slice(0,10) };
        if (cat === 'tender' || cat === 'govt' || cat === 'lged') {
            entry.tenderValue = parseFloat(document.getElementById('tenderValue').value) || 0;
            entry.tenderPct   = parseFloat(document.getElementById('tenderPct').value) || 0;
        }
        data.bills.push(entry);
        saveData();
        displayBills();
        updateDashboard();
        this.reset();
        updateBillForm();
    });

    // Dashboard stat cards
    const totalSpentCard = document.getElementById('totalSpentCard');
    const totalDueCard = document.getElementById('totalDueCard');
    if (totalSpentCard) {
        totalSpentCard.addEventListener('click', showTotalSpentDetails);
    }
    if (totalDueCard) {
        totalDueCard.addEventListener('click', showTotalDueDetails);
    }

    // Entity help link
    const entityHelpLink = document.getElementById('entityHelpLink');
    if (entityHelpLink) {
        entityHelpLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('entityList').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Bottom navigation
    document.querySelectorAll('.bnav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            openSection(this.dataset.target);
        });
    });

    // Section summary cards on dashboard
    document.querySelectorAll('.sec-card').forEach(card => {
        card.addEventListener('click', function() {
            openSection(this.dataset.target);
        });
    });

    initSections();

    // Close detail panel
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', function() {
            const detailPanel = document.getElementById('detailPanel');
            if (detailPanel) detailPanel.classList.add('hidden');
        });
    }

    // Clear data button
    document.getElementById('clearDataBtn').addEventListener('click', function() {
        if (confirm('সব ডেটা মুছে যাবে। নিশ্চিত?')) {
            data = {
                labour: [],
                materials: [],
                payments: [],
                engineers: [],
                expenses: []
            };
            saveData();
            displayData();
            updateDashboard();
        }
    });
});

let data = {
    labour: [],
    materials: [],
    payments: [],
    engineers: [],
    expenses: [],
    bills: [],
    contracts: [],
    cashIn: [],
    govtReceived: []
};

const toArr = v => !v ? [] : Array.isArray(v) ? v : Object.values(v);

function setSyncStatus(status) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    const map = {
        connected:    { text: '● Live',         color: 'var(--green)' },
        disconnected: { text: '○ Offline',       color: 'var(--muted)' },
        saving:       { text: '↑ Saving…',       color: 'var(--amber)' },
        local:        { text: '⬡ Local only',    color: 'var(--muted)' },
    };
    const s = map[status] || map.local;
    el.textContent = s.text;
    el.style.color = s.color;
}

function loadData() {
    if (window.firebaseDB) {
        // Real-time listener — fires on every remote or local change
        window.firebaseDB.ref('data').on('value', snapshot => {
            const val = snapshot.val();
            if (val) {
                data = {
                    labour:    toArr(val.labour),
                    materials: toArr(val.materials),
                    payments:  toArr(val.payments),
                    engineers: toArr(val.engineers),
                    expenses:  toArr(val.expenses),
                    bills:     toArr(val.bills),
                    contracts: toArr(val.contracts),
                    cashIn:       toArr(val.cashIn),
                    govtReceived: toArr(val.govtReceived),
                };
                localStorage.setItem(DATABASE_KEY, JSON.stringify(data));
            }
            displayData();
            updateDashboard();
        });

        // Connection status indicator
        window.firebaseDB.ref('.info/connected').on('value', snap => {
            setSyncStatus(snap.val() ? 'connected' : 'disconnected');
        });
    } else {
        // Fallback: localStorage only
        const stored = localStorage.getItem(DATABASE_KEY);
        if (stored) data = JSON.parse(stored);
        displayData();
        setSyncStatus('local');
    }
}

function saveData() {
    localStorage.setItem(DATABASE_KEY, JSON.stringify(data));
    if (window.firebaseDB) {
        setSyncStatus('saving');
        window.firebaseDB.ref('data').set(data);
    }
}

function getFilteredData() {
    const categories = Array.from(document.querySelectorAll('.category-checks input:checked')).map(i => i.value);
    const from = document.getElementById('exportFrom').value;
    const to   = document.getElementById('exportTo').value;

    const filterDates = (arr, dateKey) => arr.filter(item => {
        if (from && item[dateKey] < from) return false;
        if (to   && item[dateKey] > to)   return false;
        return true;
    });

    return {
        categories,
        labour:    categories.includes('labour')    ? filterDates(data.labour,    'date') : [],
        materials: categories.includes('materials') ? filterDates(data.materials, 'date') : [],
        engineers: categories.includes('engineers') ? filterDates(data.engineers, 'date') : [],
        expenses:  categories.includes('expenses')  ? filterDates(data.expenses,  'date') : [],
    };
}

function downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

function runExport() {
    const format = document.querySelector('.format-btn.active').dataset.format;
    const fd = getFilteredData();
    if (format === 'json') exportJSON(fd);
    if (format === 'csv')  exportCSV(fd);
    if (format === 'pdf')  exportPDF(fd);
    document.getElementById('exportModal').classList.add('hidden');
}

function exportJSON(fd) {
    const out = {};
    if (fd.labour.length)    out.labour    = fd.labour;
    if (fd.materials.length) out.materials = fd.materials;
    if (fd.engineers.length) out.engineers = fd.engineers;
    if (fd.expenses.length)  out.expenses  = fd.expenses;
    downloadFile(JSON.stringify(out, null, 2), 'road_construction.json', 'application/json');
}

function exportCSV(fd) {
    let csv = '';
    const row = (...cols) => cols.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',') + '\n';

    if (fd.labour.length) {
        csv += 'LABOUR\n' + row('Name','Date','Amount');
        fd.labour.forEach(i => { csv += row(i.name, i.date, i.money); });
        csv += '\n';
    }
    if (fd.materials.length) {
        csv += 'MATERIALS\n' + row('Buyer','Material','Date','Bill','Paid','Due','Method','Ref');
        fd.materials.forEach(i => { csv += row(i.buyer, i.materialName, i.date, i.bill, i.paid, i.due, i.paymentType||'cash', i.paymentRef||''); });
        csv += '\n';
    }
    if (fd.engineers.length) {
        csv += 'ENGINEER DOWRY\n' + row('Name','Date','Amount','Payment');
        fd.engineers.forEach(i => { csv += row(i.name, i.date, i.amount, i.paymentType); });
        csv += '\n';
    }
    if (fd.expenses.length) {
        csv += 'EXPENSES\n' + row('Description','Date','Amount');
        fd.expenses.forEach(i => { csv += row(i.description, i.date, i.amount); });
        csv += '\n';
    }
    downloadFile('\uFEFF' + csv, 'road_construction.csv', 'text/csv;charset=utf-8');
}

function exportPDF(fd) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const from = document.getElementById('exportFrom').value;
    const to   = document.getElementById('exportTo').value;
    let y = 18;

    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('Road Construction Finance Report', 14, y); y += 7;

    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    if (from || to) { doc.text(`Period: ${from || 'Start'} — ${to || 'End'}`, 14, y); y += 5; }
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y); y += 8;

    const section = (title, head, body, color) => {
        if (!body.length) return;
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text(title, 14, y); y += 2;
        doc.autoTable({
            startY: y, head: [head], body,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: color, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 245, 236] },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 8;
    };

    const fmt = n => '\u09F3\u00a0' + Math.abs(Number(n)).toLocaleString(undefined, { maximumFractionDigits: 2 });

    section('Labour',        ['Name','Date','Amount'],
        fd.labour.map(i => [i.name, i.date, fmt(i.money)]), [45,106,79]);

    section('Materials',     ['Buyer','Material','Date','Bill','Paid','Due','Method'],
        fd.materials.map(i => [i.buyer, i.materialName, i.date, fmt(i.bill), fmt(i.paid), fmt(i.due), i.paymentType||'cash']), [26,78,140]);

    section('Engineer Dowry',['Name','Date','Amount','Payment'],
        fd.engineers.map(i => [i.name, i.date, fmt(i.amount), i.paymentType]), [93,63,211]);

    section('Expenses',      ['Description','Date','Amount'],
        fd.expenses.map(i => [i.description, i.date, fmt(i.amount)]), [214,78,31]);

    // Totals
    let spent = 0, due = 0;
    fd.labour.forEach(i => spent += i.money);
    fd.materials.forEach(i => { spent += i.paid; due += i.due; });
    fd.engineers.forEach(i => spent += i.amount);
    fd.expenses.forEach(i => spent += i.amount);

    doc.setDrawColor(200); doc.line(14, y, 196, y); y += 6;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(`Total Spent: ${fmt(spent)}`, 14, y); y += 6;
    doc.text(`Total Due:   ${fmt(due)}`,   14, y);

    doc.save('road_construction_report.pdf');
}

function calculateDue(bill, paid) {
    return Math.max(0, bill - paid);
}

function addLabour(name, date, money) {
    data.labour.push({ name, date, money });
    saveData();
    displayData();
    updateDashboard();
}

function addMaterial(buyer, materialName, date, bill, quantity, paid, due, paymentType, paymentRef) {
    data.materials.push({ buyer, materialName, date, bill, quantity, paid, due, paymentType: paymentType || 'cash', paymentRef: paymentRef || '' });
    saveData();
    displayData();
    updateDashboard();
}

function addPayment(type, details, amount, imageFile) {
    let imageData = null;
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageData = e.target.result;
            data.payments.push({ type, details, amount, image: imageData });
            saveData();
            displayData();
            updateDashboard();
        };
        reader.readAsDataURL(imageFile);
    } else {
        data.payments.push({ type, details, amount, image: null });
        saveData();
        displayData();
        updateDashboard();
    }
}

function addEngineer(name, date, amount, paymentType) {
    data.engineers.push({ name, date, amount, paymentType });
    saveData();
    displayData();
    updateDashboard();
}

function addExpense(description, date, amount) {
    data.expenses.push({ description, date, amount });
    saveData();
    displayData();
    updateDashboard();
}

function displayData() {
    displayLabour();
    displayMaterials();
    displayPayments();
    displayEngineers();
    displayExpenses();
    displayBills();
    displayGotBills();
    displayContracts();
    displayCash();
    renderEntitySummary();
    
    // Add delete event listeners
    document.querySelectorAll('.delete-btn[data-type]').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const index = parseInt(this.getAttribute('data-index'));
            if (type && !Number.isNaN(index)) {
                deleteItem(type, index);
            }
        });
    });
}

function deleteItem(type, index) {
    if (!confirm('এই এন্ট্রি মুছবেন?')) return;
    if (type === 'bills') {
        data.bills.splice(index, 1);
    } else if (type === 'contracts') {
        data.contracts.splice(index, 1);
    } else if (type === 'cashIn') {
        data.cashIn.splice(index, 1);
    } else if (type === 'govtReceived') {
        data.govtReceived.splice(index, 1);
    } else if (data[type]) {
        data[type].splice(index, 1);
    }
    saveData();
    displayData();
    updateDashboard();
}

function displayLabour() {
    const list = document.getElementById('labourList');
    list.innerHTML = '';
    data.labour.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'record-card record-labour';
        li.innerHTML = `
            <div class="record-left">
                <span class="record-name">${item.name}</span>
                <span class="record-date">${item.date}</span>
            </div>
            <div class="record-right">
                <span class="record-amount">${fmtTaka(item.money)}</span>
                <button class="delete-btn" data-type="labour" data-index="${index}">×</button>
            </div>`;
        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            showLabourDetails(item.name);
        });
        list.appendChild(li);
    });
}

function displayMaterials() {
    const list = document.getElementById('materialList');
    if (!list) return;
    list.innerHTML = '';
    data.materials.forEach((item, index) => {
        const li = document.createElement('li');
        const payLabel = item.paymentType === 'bank' ? `Bank${item.paymentRef ? ' · ' + item.paymentRef : ''}` : 'Cash';
        li.innerHTML = `${item.buyer} - ${item.materialName} - ${item.date} - বিল: ${fmtTaka(item.bill)}, পরিশোধ: ${fmtTaka(item.paid)} <span class="pay-method-tag">${payLabel}</span>, বাকি: ${fmtTaka(item.due)} <button class="delete-btn" data-type="materials" data-index="${index}">×</button>`;
        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete')) return;
            showMaterialDetails(item.buyer, item.materialName);
        });
        list.appendChild(li);
    });
}

function displayPayments() {
    const list = document.getElementById('paymentList');
    if (!list) return;
    list.innerHTML = '';
    data.payments.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${item.type} - ${item.details} - ${fmtTaka(item.amount)} <button class="delete-btn" data-type="payments" data-index="${index}">×</button>`;
        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.style.width = '50px';
            img.style.height = '50px';
            li.insertBefore(img, li.lastElementChild);
        }
        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete')) return;
            showPaymentDetails(index);
        });
        list.appendChild(li);
    });
}

function displayEngineers() {
    const list = document.getElementById('engineerList');
    list.innerHTML = '';
    data.engineers.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'record-card record-engineer';
        li.innerHTML = `
            <div class="record-left">
                <span class="record-name">${item.name}</span>
                <span class="record-date">${item.date} · ${item.paymentType}</span>
            </div>
            <div class="record-right">
                <span class="record-amount">${fmtTaka(item.amount)}</span>
                <button class="delete-btn" data-type="engineers" data-index="${index}">×</button>
            </div>`;
        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            showEngineerDetails(item.name);
        });
        list.appendChild(li);
    });
}

function displayExpenses() {
    const list = document.getElementById('expenseList');
    list.innerHTML = '';
    data.expenses.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'record-card record-expense';
        li.innerHTML = `
            <div class="record-left">
                <span class="record-name">${item.description}</span>
                <span class="record-date">${item.date}</span>
            </div>
            <div class="record-right">
                <span class="record-amount">${fmtTaka(item.amount)}</span>
                <button class="delete-btn" data-type="expenses" data-index="${index}">×</button>
            </div>`;
        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            showExpenseDetails(index);
        });
        list.appendChild(li);
    });
}

function updateDashboard() {
    let totalSpent = 0;
    let totalDue = 0;

    data.labour.forEach(item => totalSpent += (item.money || 0));
    data.materials.forEach(item => {
        totalSpent += (item.paid || 0);
        totalDue += (item.due || 0);
    });
    data.payments.forEach(item => totalSpent += (item.amount || 0));
    data.engineers.forEach(item => totalSpent += (item.amount || 0));
    data.expenses.forEach(item => totalSpent += (item.amount || 0));

    const bills = data.bills || [];
    const tenderBills = bills.filter(b => b.cat === 'tender');
    const govtBills   = bills.filter(b => b.cat === 'govt');
    const lgedBills   = bills.filter(b => b.cat === 'lged');
    const tenderTotal = tenderBills.reduce((s, b) => s + (b.amount || 0), 0);
    const govtTotal   = govtBills.reduce((s, b) => s + (b.amount || 0), 0);
    const lgedTotal   = lgedBills.reduce((s, b) => s + (b.amount || 0), 0);
    // Final income = last step in the chain: LGED → Govt → Tender
    const govtPayment = lgedBills.length ? lgedTotal : govtBills.length ? govtTotal : tenderTotal;
    const profit = govtPayment - totalSpent;
    const isProfit = profit >= 0;

    const totalGotBill  = (data.govtReceived || []).reduce((s, g) => s + (g.amount || 0), 0);

    document.getElementById('totalSpent').textContent = fmtTaka(totalSpent);

    const fmt = fmtTaka;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    // Liquid cash
    const totalCashIn = (data.cashIn || []).reduce((s, c) => s + (c.amount || 0), 0);
    const cashBalance = totalCashIn - totalSpent;
    const cashPositive = cashBalance >= 0;
    set('cashTotalIn',  fmt(totalCashIn));
    set('cashTotalOut', fmt(totalSpent));
    set('cashBalance',  (cashPositive ? '' : '-') + fmt(cashBalance));
    const cashBalEl  = document.getElementById('cashBalance');
    const cashLabEl  = document.getElementById('cashBalanceLabel');
    if (cashBalEl) cashBalEl.className = 'cash-val cash-balance ' + (cashPositive ? 'cash-pos' : 'cash-neg');
    if (cashLabEl) cashLabEl.className = 'cash-label cash-balance-label ' + (cashPositive ? 'cash-pos' : 'cash-neg');

    const dueFromGovt = Math.max(0, govtPayment - totalGotBill);
    document.getElementById('totalDue').textContent = fmtTaka(dueFromGovt);

    set('pnlTender',      fmt(tenderTotal));
    set('pnlGovt',        fmt(govtTotal));
    set('pnlLged',        fmt(lgedTotal));
    set('pnlGovtPayment', fmt(govtPayment));
    set('pnlSpent',       fmt(totalSpent));

    const pnlResult = document.getElementById('pnlResult');
    const pnlLabel  = document.getElementById('pnlResultLabel');
    if (pnlResult) {
        pnlResult.textContent = (isProfit ? '+' : '-') + fmt(profit);
        pnlResult.className = 'pnl-amount pnl-result ' + (isProfit ? 'is-profit' : 'is-loss');
    }
    if (pnlLabel) {
        pnlLabel.textContent = isProfit ? 'লাভ' : 'লোকসান';
        pnlLabel.className = 'pnl-label pnl-result-label ' + (isProfit ? 'is-profit' : 'is-loss');
    }

    updateSectionCards();
}

function showLabourDetails(name) {
    const items = data.labour.filter(item => item.name === name);
    const total = items.reduce((sum, item) => sum + item.money, 0);
    let html = `<div class="detail-header">মোট পরিশোধ: <strong>${fmtTaka(total)}</strong></div>`;
    items.forEach(item => {
        html += `<div class="detail-item">
            <span class="detail-date">${item.date}</span>
            <span class="detail-amount">${fmtTaka(item.money)}</span>
        </div>`;
    });
    showDetailsHTML(name, html);
}

function showMaterialDetails(buyer, materialName) {
    const items = data.materials.filter(item => item.buyer === buyer && item.materialName === materialName);
    const totalPaid = items.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = items.reduce((sum, item) => sum + item.due, 0);
    let html = `<div class="detail-header">পরিশোধ <strong>${fmtTaka(totalPaid)}</strong> · বাকি <span class="detail-due-text">${fmtTaka(totalDue)}</span></div>`;
    items.forEach(item => {
        const payLabel = item.paymentType === 'bank'
            ? `ব্যাংক ট্রান্সফার${item.paymentRef ? ' · ' + item.paymentRef : ''}`
            : 'নগদ';
        html += `<div class="detail-item">
            <div class="detail-meta">
                <span class="detail-date">${item.date}</span>
                <span class="detail-name">পরিমাণ: ${item.quantity}</span>
                <span class="detail-paymethod">${payLabel}</span>
            </div>
            <div class="detail-amounts">
                <span class="detail-paid-tag">পরিশোধ ${fmtTaka(item.paid)}</span>
                ${item.due > 0 ? `<span class="detail-due-tag">বাকি ${fmtTaka(item.due)}</span>` : ''}
            </div>
        </div>`;
    });
    html += `<div class="detail-total">মোট পরিশোধ: ${fmtTaka(totalPaid)}</div>`;
    showDetailsHTML(`${buyer} / ${materialName}`, html);
}

function showEngineerDetails(name) {
    const items = data.engineers.filter(item => item.name === name);
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    let html = `<div class="detail-header">মোট পরিশোধ: <strong>${fmtTaka(total)}</strong></div>`;
    items.forEach(item => {
        html += `<div class="detail-item">
            <div class="detail-meta">
                <span class="detail-date">${item.date}</span>
                <span class="detail-name">${item.paymentType}</span>
            </div>
            <span class="detail-amount">${fmtTaka(item.amount)}</span>
        </div>`;
    });
    showDetailsHTML(name, html);
}

function showPaymentDetails(index) {
    const payment = data.payments[index];
    showDetails('পেমেন্টের বিবরণ', `ধরন: ${payment.type}\nবিবরণ: ${payment.details || 'নগদ'}\nপরিমাণ: ${fmtTaka(payment.amount)}`);
}

function showBuyerDetails(buyer) {
    const items = data.materials.filter(item => item.buyer === buyer);
    if (!items.length) {
        showDetailsHTML(buyer, '<p class="due-empty">কোনো মালামাল পাওয়া যায়নি।</p>');
        return;
    }
    const totalPaid = items.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = items.reduce((sum, item) => sum + item.due, 0);
    let html = `<div class="detail-header">পরিশোধ <strong>${fmtTaka(totalPaid)}</strong> · বাকি <span class="detail-due-text">${fmtTaka(totalDue)}</span></div>`;
    items.forEach(item => {
        const payLabel = item.paymentType === 'bank'
            ? `ব্যাংক ট্রান্সফার${item.paymentRef ? ' · ' + item.paymentRef : ''}`
            : 'নগদ';
        html += `<div class="detail-item">
            <div class="detail-meta">
                <span class="detail-date">${item.date}</span>
                <span class="detail-name">${item.materialName}</span>
                <span class="detail-paymethod">${payLabel}</span>
            </div>
            <div class="detail-amounts">
                <span class="detail-paid-tag">পরিশোধ ${fmtTaka(item.paid)}</span>
                ${item.due > 0 ? `<span class="detail-due-tag">বাকি ${fmtTaka(item.due)}</span>` : ''}
            </div>
        </div>`;
    });
    html += `<div class="detail-total">মোট পরিশোধ: ${fmtTaka(totalPaid)}</div>`;
    showDetailsHTML(buyer, html);
}

function showMaterialNameDetails(name) {
    const items = data.materials.filter(item => item.materialName === name);
    if (!items.length) {
        showDetailsHTML(name, '<p class="due-empty">কোনো লেনদেন পাওয়া যায়নি।</p>');
        return;
    }
    const totalPaid = items.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = items.reduce((sum, item) => sum + item.due, 0);
    let html = `<div class="detail-header">পরিশোধ <strong>${fmtTaka(totalPaid)}</strong> · বাকি <span class="detail-due-text">${fmtTaka(totalDue)}</span></div>`;
    items.forEach(item => {
        html += `<div class="detail-item">
            <div class="detail-meta">
                <span class="detail-date">${item.date}</span>
                <span class="detail-name">${item.buyer}</span>
            </div>
            <div class="detail-amounts">
                <span class="detail-paid-tag">পরিশোধ ${fmtTaka(item.paid)}</span>
                ${item.due > 0 ? `<span class="detail-due-tag">বাকি ${fmtTaka(item.due)}</span>` : ''}
            </div>
        </div>`;
    });
    html += `<div class="detail-total">মোট পরিশোধ: ${fmtTaka(totalPaid)}</div>`;
    showDetailsHTML(name, html);
}


const BILL_CAT_LABELS = {
    tender: 'টেন্ডার ড্রপ',
    govt:   'সরকারি ফি',
    lged:   'এলজিইডি ফি',
    other:  'অন্যান্য'
};
const BILL_CAT_COLORS = {
    tender: 'var(--amber)',
    govt:   'var(--blue)',
    lged:   'var(--green)',
    other:  'var(--muted)'
};

function displayBills() {
    const list = document.getElementById('billList');
    if (!list) return;
    list.innerHTML = '';
    if (!data.bills || !data.bills.length) return;

    const today = new Date().toISOString().slice(0, 10);

    data.bills.forEach((bill, index) => {
        const overdue = bill.status === 'pending' && bill.dueDate < today;
        const isPaid  = bill.status === 'paid';
        const li = document.createElement('li');
        li.className = `bill-card ${isPaid ? 'bill-paid' : overdue ? 'bill-overdue' : 'bill-pending'}`;
        li.innerHTML = `
            <div class="bill-top">
                <span class="bill-cat-tag" style="background:${BILL_CAT_COLORS[bill.cat] || 'var(--muted)'}20;color:${BILL_CAT_COLORS[bill.cat] || 'var(--muted)'}">
                    ${BILL_CAT_LABELS[bill.cat] || bill.cat}
                </span>
                <span class="bill-status-tag ${isPaid ? 'bill-tag-paid' : overdue ? 'bill-tag-overdue' : 'bill-tag-pending'}">
                    ${isPaid ? '✓ পরিশোধ' : overdue ? '! মেয়াদোত্তীর্ণ' : '⏳ বাকি'}
                </span>
            </div>
            <div class="bill-middle">
                <div class="bill-info">
                    <span class="bill-party">${bill.party || '—'}</span>
                    <span class="bill-desc">${bill.description}</span>
                    ${bill.tenderValue ? `<span class="bill-tender-meta">${fmtTaka(bill.tenderValue)} − ${bill.tenderPct}%</span>` : ''}
                    <span class="bill-due-date" style="color:${overdue ? 'var(--red)' : 'var(--muted)'}">শেষ তারিখ: ${bill.dueDate}</span>
                </div>
                <span class="bill-amount">${fmtTaka(bill.amount)}</span>
            </div>
            <div class="bill-actions">
                ${!isPaid ? `<button class="bill-pay-btn" data-index="${index}">✓ পরিশোধ করুন</button>` : ''}
                <button class="delete-btn" data-type="bills" data-index="${index}">×</button>
            </div>`;
        list.appendChild(li);
    });

    list.querySelectorAll('.bill-pay-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const i = parseInt(this.dataset.index);
            data.bills[i].status = 'paid';
            saveData();
            displayBills();
            updateDashboard();
        });
    });
}

function renderEntitySummary() {
    const list = document.getElementById('entityList');
    if (!list) return;
    list.innerHTML = '';

    const addEntities = (type, label, names) => {
        const uniqueNames = Array.from(new Set(names)).sort();
        uniqueNames.forEach(name => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="entity-type-items"><span class="entity-tag">${label}</span><span class="entity-name">${name}</span></span>`;
            li.dataset.entityType = type;
            li.dataset.entityName = name;
            li.addEventListener('click', () => showEntityDetails(type, name));
            list.appendChild(li);
        });
    };

    addEntities('labour', 'শ্রমিক', data.labour.map(item => item.name));
    addEntities('engineer', 'ইঞ্জিনিয়ার', data.engineers.map(item => item.name));

    // Materials: show unique buyer+material pairs
    const uniquePairs = Array.from(new Set(data.materials.map(i => `${i.buyer}||${i.materialName}`))).sort();
    uniquePairs.forEach(pair => {
        const [buyer, materialName] = pair.split('||');
        const li = document.createElement('li');
        li.innerHTML = `<span class="entity-type-items"><span class="entity-tag">মালামাল</span><span class="entity-name">${materialName}</span><span class="entity-buyer">${buyer}</span></span>`;
        li.addEventListener('click', () => showMaterialDetails(buyer, materialName));
        list.appendChild(li);
    });
}

function showEntityDetails(type, name) {
    if (type === 'labour') return showLabourDetails(name);
    if (type === 'engineer') return showEngineerDetails(name);
    if (type === 'buyer') return showBuyerDetails(name);
    if (type === 'material') return showMaterialNameDetails(name);
}

function showExpenseDetails(index) {
    const expense = data.expenses[index];
    showDetails('খরচের বিবরণ', `বিবরণ: ${expense.description}\nতারিখ: ${expense.date}\nপরিমাণ: ${fmtTaka(expense.amount)}`);
}

function showTotalSpentDetails() {
    let totalSpent = 0;
    let html = '';

    const section = (label, rows) => {
        if (!rows.length) return '';
        return `<div class="detail-section-title">${label}</div>${rows.join('')}`;
    };

    const row = (date, name, amount) => `<div class="detail-item">
        <div class="detail-meta">
            <span class="detail-date">${date}</span>
            <span class="detail-name">${name}</span>
        </div>
        <span class="detail-amount">${fmtTaka(amount)}</span>
    </div>`;

    data.labour.forEach(item => { totalSpent += item.money; });
    data.materials.forEach(item => { totalSpent += item.paid; });
    data.payments.forEach(item => { totalSpent += item.amount; });
    data.engineers.forEach(item => { totalSpent += item.amount; });
    data.expenses.forEach(item => { totalSpent += item.amount; });

    html += section('শ্রমিক', data.labour.map(i => row(i.date, i.name, i.money)));
    html += section('মালামাল', data.materials.map(i => row(i.date, `${i.buyer} / ${i.materialName}`, i.paid)));
    html += section('পেমেন্ট', data.payments.map(i => row(i.type, i.details || 'নগদ', i.amount)));
    html += section('ইঞ্জিনিয়ার', data.engineers.map(i => row(i.date, i.name, i.amount)));
    html += section('অন্যান্য খরচ', data.expenses.map(i => row(i.date, i.description, i.amount)));

    if (!html) html = '<p class="due-empty">এখনো কোনো খরচ নেই।</p>';
    html += `<div class="detail-total">মোট খরচ: ${fmtTaka(totalSpent)}</div>`;
    showDetailsHTML('মোট খরচ', html);
}

function showTotalDueDetails() {
    const totalDue = data.materials.reduce((sum, item) => sum + item.due, 0);
    const items = data.materials.filter(item => item.due > 0);
    let html = '';
    if (!items.length) {
        html = '<p class="due-empty">কোনো বাকি নেই।</p>';
    } else {
        items.forEach(item => {
            html += `<div class="due-item">
                <div class="due-meta">
                    <span class="due-date">${item.date}</span>
                    <span class="due-name">${item.buyer} / ${item.materialName}</span>
                </div>
                <span class="due-amount">বাকি ${fmtTaka(item.due)}</span>
            </div>`;
        });
    }
    html += `<div class="due-total">মোট বাকি: ${fmtTaka(totalDue)}</div>`;
    showDetailsHTML('মোট বাকি', html);
}

function showDetailsHTML(title, htmlContent) {
    const detailPanel = document.getElementById('detailPanel');
    const detailsTitle = document.getElementById('detailsTitle');
    const detailsContent = document.getElementById('detailsContent');
    if (detailPanel && detailsTitle && detailsContent) {
        detailsTitle.textContent = title;
        detailsContent.innerHTML = htmlContent;
        detailsContent.classList.add('html-content');
        detailPanel.classList.remove('hidden');
        detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showDetails(title, content) {
    const detailPanel = document.getElementById('detailPanel');
    const detailsTitle = document.getElementById('detailsTitle');
    const detailsContent = document.getElementById('detailsContent');
    if (detailPanel && detailsTitle && detailsContent) {
        detailsTitle.textContent = title;
        detailsContent.textContent = content;
        detailsContent.classList.remove('html-content');
        detailPanel.classList.remove('hidden');
        detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        alert(`${title}\n\n${content}`);
    }
}

const SECTION_IDS = ['secLabour', 'secMaterials', 'secEngineer', 'secExpenses', 'secBills', 'secPeople', 'secCash', 'secContract'];

function initSections() {
    SECTION_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('hidden');

        const h3 = el.querySelector('h3');
        if (h3 && !h3.querySelector('.sec-close-btn')) {
            const btn = document.createElement('button');
            btn.className = 'close-btn sec-close-btn';
            btn.type = 'button';
            btn.innerHTML = '✕';
            btn.setAttribute('aria-label', 'বন্ধ করুন');
            btn.addEventListener('click', () => {
                el.classList.add('hidden');
                document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.bnav-btn[data-target="dashboard"]')?.classList.add('active');
            });
            h3.appendChild(btn);
        }
    });
    document.querySelector('.bnav-btn[data-target="dashboard"]')?.classList.add('active');
}

function openSection(id) {
    document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
    if (id === 'dashboard') {
        SECTION_IDS.forEach(sid => document.getElementById(sid)?.classList.add('hidden'));
        document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelector('.bnav-btn[data-target="dashboard"]')?.classList.add('active');
        return;
    }
    // Close all sections, then open only the target
    SECTION_IDS.forEach(sid => document.getElementById(sid)?.classList.add('hidden'));
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    document.querySelector(`.bnav-btn[data-target="${id}"]`)?.classList.add('active');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
}

function displayGotBills() {
    const list = document.getElementById('gotBillList');
    if (!list) return;
    list.innerHTML = '';
    (data.govtReceived || []).forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'record-card record-gotbill';
        li.innerHTML = `
            <div class="record-left">
                <span class="record-name">${item.description}</span>
                <span class="record-date">${item.date}</span>
            </div>
            <div class="record-right">
                <span class="record-amount">${fmtTaka(item.amount)}</span>
                <button class="delete-btn" data-type="govtReceived" data-index="${index}">×</button>
            </div>`;
        li.querySelector('.delete-btn').addEventListener('click', function() {
            deleteItem('govtReceived', parseInt(this.dataset.index));
        });
        list.appendChild(li);
    });
}

function displayCash() {
    const list = document.getElementById('cashList');
    if (!list) return;
    list.innerHTML = '';
    (data.cashIn || []).forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'record-card record-cash';
        li.innerHTML = `
            <div class="record-left">
                <span class="record-name">${item.description}</span>
                <span class="record-date">${item.date}</span>
            </div>
            <div class="record-right">
                <span class="record-amount">${fmtTaka(item.amount)}</span>
                <button class="delete-btn" data-type="cashIn" data-index="${index}">×</button>
            </div>`;
        li.querySelector('.delete-btn').addEventListener('click', function() {
            deleteItem('cashIn', parseInt(this.dataset.index));
        });
        list.appendChild(li);
    });
}

function displayContracts() {
    const list = document.getElementById('contractList');
    if (!list) return;
    list.innerHTML = '';
    (data.contracts || []).forEach((contract, index) => {
        const paid = (data.labour || [])
            .filter(l => l.name.trim().toLowerCase() === contract.name.trim().toLowerCase())
            .reduce((s, l) => s + (l.money || 0), 0);
        const remaining = Math.max(0, contract.amount - paid);
        const pct = contract.amount > 0 ? Math.min(100, (paid / contract.amount) * 100) : 0;

        const li = document.createElement('li');
        li.className = 'contract-card';
        li.innerHTML = `
            <div class="contract-top">
                <span class="contract-name">${contract.name}</span>
                <button class="delete-btn" data-type="contracts" data-index="${index}">×</button>
            </div>
            ${contract.note ? `<span class="contract-note">${contract.note}</span>` : ''}
            <div class="contract-amounts">
                <div class="contract-stat">
                    <span class="contract-stat-label">চুক্তি</span>
                    <span class="contract-stat-value">${fmtTaka(contract.amount)}</span>
                </div>
                <div class="contract-stat">
                    <span class="contract-stat-label">পরিশোধ</span>
                    <span class="contract-stat-value cstat-paid">${fmtTaka(paid)}</span>
                </div>
                <div class="contract-stat">
                    <span class="contract-stat-label">বাকি</span>
                    <span class="contract-stat-value cstat-remaining">${fmtTaka(remaining)}</span>
                </div>
            </div>
            <div class="contract-bar-wrap">
                <div class="contract-bar-fill" style="width:${pct.toFixed(0)}%"></div>
            </div>
            <span class="contract-bar-label">${pct.toFixed(0)}% পরিশোধ · ${contract.date}</span>`;
        list.appendChild(li);
    });

    // Wire up delete buttons
    list.querySelectorAll('.delete-btn[data-type="contracts"]').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteItem('contracts', parseInt(this.dataset.index));
        });
    });
}

function updateSectionCards() {
    const labourTotal = data.labour.reduce((s, i) => s + (i.money || 0), 0);
    const matPaid = data.materials.reduce((s, i) => s + (i.paid || 0), 0);
    const matDue = data.materials.reduce((s, i) => s + (i.due || 0), 0);
    const engTotal = data.engineers.reduce((s, i) => s + (i.amount || 0), 0);
    const expTotal = data.expenses.reduce((s, i) => s + (i.amount || 0), 0);
    const pendingBills = (data.bills || []).filter(b => b.status !== 'paid');
    const billsTotal = pendingBills.reduce((s, b) => s + (b.amount || 0), 0);
    const peopleCount = new Set([
        ...data.labour.map(i => i.name),
        ...data.engineers.map(i => i.name),
        ...data.materials.map(i => i.buyer)
    ]).size;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('dashLabourTotal', fmtTaka(labourTotal));
    set('dashLabourSub', data.labour.length + ' এন্ট্রি');
    set('dashMatTotal', fmtTaka(matPaid));
    set('dashMatSub', matDue > 0 ? 'বাকি ' + fmtTaka(matDue) : 'বাকি নেই');
    set('dashEngTotal', fmtTaka(engTotal));
    set('dashEngSub', data.engineers.length + ' এন্ট্রি');
    set('dashExpTotal', fmtTaka(expTotal));
    set('dashExpSub', data.expenses.length + ' এন্ট্রি');
    set('dashBillsTotal', pendingBills.length + ' বাকি আছে');
    set('dashBillsSub', fmtTaka(billsTotal));
    set('dashPeopleTotal', peopleCount + ' জন');
    set('dashPeopleSub', data.materials.length + ' মালামাল');

    const contracts = data.contracts || [];
    const contractRemaining = contracts.reduce((s, c) => {
        const paid = (data.labour || [])
            .filter(l => l.name.trim().toLowerCase() === c.name.trim().toLowerCase())
            .reduce((a, l) => a + (l.money || 0), 0);
        return s + Math.max(0, c.amount - paid);
    }, 0);
    set('dashContractTotal', contracts.length + ' চুক্তি');
    set('dashContractSub', fmtTaka(contractRemaining) + ' বাকি');
}
