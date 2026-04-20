const DATABASE_KEY = 'roadConstructionFinanceDB';

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
            alert('Please enter valid data.');
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
            alert('Please enter valid data. Paid amount must be between 0 and bill amount.');
            return;
        }
        if (paid > 0 && paymentType === 'bank' && !paymentRef) {
            alert('Please enter a reference number for bank transfer.');
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
            alert('Please enter valid data.');
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
            alert('Please enter valid data.');
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

    // Bills to Pay form
    const billCategoryEl = document.getElementById('billCategory');
    const billPartySelectGroup = document.getElementById('billPartySelectGroup');
    const billPartyInputGroup  = document.getElementById('billPartyInputGroup');
    const billPartySelect = document.getElementById('billPartySelect');
    const billPartyInput  = document.getElementById('billPartyInput');

    function populateBillParty() {
        const cat = billCategoryEl.value;
        const freeText = cat === 'tender' || cat === 'other';
        billPartySelectGroup.classList.toggle('hidden', freeText);
        billPartyInputGroup.classList.toggle('hidden', !freeText);
        if (freeText) return;

        let names = [];
        if (cat === 'material') names = [...new Set(data.materials.map(i => i.buyer))];
        if (cat === 'labour')   names = [...new Set(data.labour.map(i => i.name))];
        if (cat === 'engineer') names = [...new Set(data.engineers.map(i => i.name))];

        billPartySelect.innerHTML = names.length
            ? names.map(n => `<option value="${n}">${n}</option>`).join('')
            : '<option value="">— no entries yet —</option>';
    }

    billCategoryEl.addEventListener('change', populateBillParty);
    populateBillParty();

    document.getElementById('billForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const cat = billCategoryEl.value;
        const freeText = cat === 'tender' || cat === 'other';
        const party = freeText ? billPartyInput.value.trim() : billPartySelect.value;
        const description = document.getElementById('billDescription').value.trim();
        const amount = parseFloat(document.getElementById('billAmountInput').value);
        const dueDate = document.getElementById('billDueDate').value;
        if (!description || !amount || !dueDate || (!party && !freeText)) {
            alert('Please fill all fields.');
            return;
        }
        data.bills.push({ cat, party, description, amount, dueDate, status: 'pending', created: new Date().toISOString().slice(0,10) });
        saveData();
        displayBills();
        updateDashboard();
        this.reset();
        populateBillParty();
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
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
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
    bills: []
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

    const $ = n => '$' + Number(n).toLocaleString();

    section('Labour',        ['Name','Date','Amount'],
        fd.labour.map(i => [i.name, i.date, $(i.money)]), [45,106,79]);

    section('Materials',     ['Buyer','Material','Date','Bill','Paid','Due','Method'],
        fd.materials.map(i => [i.buyer, i.materialName, i.date, $(i.bill), $(i.paid), $(i.due), i.paymentType||'cash']), [26,78,140]);

    section('Engineer Dowry',['Name','Date','Amount','Payment'],
        fd.engineers.map(i => [i.name, i.date, $(i.amount), i.paymentType]), [93,63,211]);

    section('Expenses',      ['Description','Date','Amount'],
        fd.expenses.map(i => [i.description, i.date, $(i.amount)]), [214,78,31]);

    // Totals
    let spent = 0, due = 0;
    fd.labour.forEach(i => spent += i.money);
    fd.materials.forEach(i => { spent += i.paid; due += i.due; });
    fd.engineers.forEach(i => spent += i.amount);
    fd.expenses.forEach(i => spent += i.amount);

    doc.setDrawColor(200); doc.line(14, y, 196, y); y += 6;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(`Total Spent: ${$(spent)}`, 14, y); y += 6;
    doc.text(`Total Due:   ${$(due)}`,   14, y);

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
    if (!confirm('Delete this entry?')) return;
    if (type === 'bills') {
        data.bills.splice(index, 1);
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
                <span class="record-amount">$${Number(item.money).toLocaleString()}</span>
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
        li.innerHTML = `${item.buyer} - ${item.materialName} - ${item.date} - Bill: $${item.bill}, Paid: $${item.paid} <span class="pay-method-tag">${payLabel}</span>, Due: $${item.due} <button class="delete-btn" data-type="materials" data-index="${index}">×</button>`;
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
        li.innerHTML = `${item.type} - ${item.details} - $${item.amount} <button class="delete-btn" data-type="payments" data-index="${index}">×</button>`;
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
                <span class="record-amount">$${Number(item.amount).toLocaleString()}</span>
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
                <span class="record-amount">$${Number(item.amount).toLocaleString()}</span>
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

    data.labour.forEach(item => totalSpent += item.money);
    data.materials.forEach(item => {
        totalSpent += item.paid;
        totalDue += item.due;
    });
    data.payments.forEach(item => totalSpent += item.amount);
    data.engineers.forEach(item => totalSpent += item.amount);
    data.expenses.forEach(item => totalSpent += item.amount);

    document.getElementById('totalSpent').textContent = totalSpent.toFixed(2);
    document.getElementById('totalDue').textContent = totalDue.toFixed(2);
}

function showLabourDetails(name) {
    const items = data.labour.filter(item => item.name === name);
    const total = items.reduce((sum, item) => sum + item.money, 0);
    let html = `<div class="detail-header">Total Paid: <strong>$${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>`;
    items.forEach(item => {
        html += `<div class="detail-item">
            <span class="detail-date">${item.date}</span>
            <span class="detail-amount">$${Number(item.money).toLocaleString()}</span>
        </div>`;
    });
    showDetailsHTML(name, html);
}

function showMaterialDetails(buyer, materialName) {
    const items = data.materials.filter(item => item.buyer === buyer && item.materialName === materialName);
    const totalPaid = items.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = items.reduce((sum, item) => sum + item.due, 0);
    let html = `<div class="detail-header">Paid <strong>$${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> · Due <span class="detail-due-text">$${totalDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>`;
    items.forEach(item => {
        const payLabel = item.paymentType === 'bank'
            ? `Bank Transfer${item.paymentRef ? ' · ' + item.paymentRef : ''}`
            : 'Cash';
        html += `<div class="detail-item">
            <div class="detail-meta">
                <span class="detail-date">${item.date}</span>
                <span class="detail-name">Qty: ${item.quantity}</span>
                <span class="detail-paymethod">${payLabel}</span>
            </div>
            <div class="detail-amounts">
                <span class="detail-paid-tag">Paid $${Number(item.paid).toLocaleString()}</span>
                ${item.due > 0 ? `<span class="detail-due-tag">Due $${Number(item.due).toLocaleString()}</span>` : ''}
            </div>
        </div>`;
    });
    html += `<div class="detail-total">Total Paid: $${totalPaid.toFixed(2)}</div>`;
    showDetailsHTML(`${buyer} / ${materialName}`, html);
}

function showEngineerDetails(name) {
    const items = data.engineers.filter(item => item.name === name);
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    let html = `<div class="detail-header">Total Paid: <strong>$${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>`;
    items.forEach(item => {
        html += `<div class="detail-item">
            <div class="detail-meta">
                <span class="detail-date">${item.date}</span>
                <span class="detail-name">${item.paymentType}</span>
            </div>
            <span class="detail-amount">$${Number(item.amount).toLocaleString()}</span>
        </div>`;
    });
    showDetailsHTML(name, html);
}

function showPaymentDetails(index) {
    const payment = data.payments[index];
    showDetails('Payment details', `Type: ${payment.type}\nDetails: ${payment.details || 'cash'}\nAmount: $${payment.amount}`);
}

function showBuyerDetails(buyer) {
    const items = data.materials.filter(item => item.buyer === buyer);
    if (!items.length) {
        showDetailsHTML(buyer, '<p class="due-empty">No materials found for this buyer.</p>');
        return;
    }
    const totalPaid = items.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = items.reduce((sum, item) => sum + item.due, 0);
    let html = `<div class="detail-header">Paid <strong>$${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> · Due <span class="detail-due-text">$${totalDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>`;
    items.forEach(item => {
        const payLabel = item.paymentType === 'bank'
            ? `Bank Transfer${item.paymentRef ? ' · ' + item.paymentRef : ''}`
            : 'Cash';
        html += `<div class="detail-item">
            <div class="detail-meta">
                <span class="detail-date">${item.date}</span>
                <span class="detail-name">${item.materialName}</span>
                <span class="detail-paymethod">${payLabel}</span>
            </div>
            <div class="detail-amounts">
                <span class="detail-paid-tag">Paid $${Number(item.paid).toLocaleString()}</span>
                ${item.due > 0 ? `<span class="detail-due-tag">Due $${Number(item.due).toLocaleString()}</span>` : ''}
            </div>
        </div>`;
    });
    html += `<div class="detail-total">Total Paid: $${totalPaid.toFixed(2)}</div>`;
    showDetailsHTML(buyer, html);
}

function showMaterialNameDetails(name) {
    const items = data.materials.filter(item => item.materialName === name);
    if (!items.length) {
        showDetailsHTML(name, '<p class="due-empty">No transactions found for this material.</p>');
        return;
    }
    const totalPaid = items.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = items.reduce((sum, item) => sum + item.due, 0);
    let html = `<div class="detail-header">Paid <strong>$${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> · Due <span class="detail-due-text">$${totalDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>`;
    items.forEach(item => {
        html += `<div class="detail-item">
            <div class="detail-meta">
                <span class="detail-date">${item.date}</span>
                <span class="detail-name">${item.buyer}</span>
            </div>
            <div class="detail-amounts">
                <span class="detail-paid-tag">Paid $${Number(item.paid).toLocaleString()}</span>
                ${item.due > 0 ? `<span class="detail-due-tag">Due $${Number(item.due).toLocaleString()}</span>` : ''}
            </div>
        </div>`;
    });
    html += `<div class="detail-total">Total Paid: $${totalPaid.toFixed(2)}</div>`;
    showDetailsHTML(name, html);
}


const BILL_CAT_LABELS = { material: 'Material', labour: 'Labour', engineer: 'Engineer', tender: 'Tender Drop', other: 'Other' };
const BILL_CAT_COLORS = { material: 'var(--blue)', labour: 'var(--green)', engineer: '#7c3aed', tender: 'var(--amber)', other: 'var(--muted)' };

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
                    ${isPaid ? '✓ Paid' : overdue ? '! Overdue' : '⏳ Pending'}
                </span>
            </div>
            <div class="bill-middle">
                <div class="bill-info">
                    <span class="bill-party">${bill.party || '—'}</span>
                    <span class="bill-desc">${bill.description}</span>
                    <span class="bill-due-date" style="color:${overdue ? 'var(--red)' : 'var(--muted)'}">Due: ${bill.dueDate}</span>
                </div>
                <span class="bill-amount">$${Number(bill.amount).toLocaleString()}</span>
            </div>
            <div class="bill-actions">
                ${!isPaid ? `<button class="bill-pay-btn" data-index="${index}">✓ Mark Paid</button>` : ''}
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

    addEntities('labour', 'Labour', data.labour.map(item => item.name));
    addEntities('engineer', 'Engineer', data.engineers.map(item => item.name));

    // Materials: show unique buyer+material pairs
    const uniquePairs = Array.from(new Set(data.materials.map(i => `${i.buyer}||${i.materialName}`))).sort();
    uniquePairs.forEach(pair => {
        const [buyer, materialName] = pair.split('||');
        const li = document.createElement('li');
        li.innerHTML = `<span class="entity-type-items"><span class="entity-tag">Material</span><span class="entity-name">${materialName}</span><span class="entity-buyer">${buyer}</span></span>`;
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
    showDetails('Expense details', `Description: ${expense.description}\nDate: ${expense.date}\nAmount: $${expense.amount}`);
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
        <span class="detail-amount">$${Number(amount).toLocaleString()}</span>
    </div>`;

    data.labour.forEach(item => { totalSpent += item.money; });
    data.materials.forEach(item => { totalSpent += item.paid; });
    data.payments.forEach(item => { totalSpent += item.amount; });
    data.engineers.forEach(item => { totalSpent += item.amount; });
    data.expenses.forEach(item => { totalSpent += item.amount; });

    html += section('Labour', data.labour.map(i => row(i.date, i.name, i.money)));
    html += section('Materials', data.materials.map(i => row(i.date, `${i.buyer} / ${i.materialName}`, i.paid)));
    html += section('Payments', data.payments.map(i => row(i.type, i.details || 'Cash', i.amount)));
    html += section('Engineers', data.engineers.map(i => row(i.date, i.name, i.amount)));
    html += section('Expenses', data.expenses.map(i => row(i.date, i.description, i.amount)));

    if (!html) html = '<p class="due-empty">No spending recorded yet.</p>';
    html += `<div class="detail-total">Total Spent: $${totalSpent.toFixed(2)}</div>`;
    showDetailsHTML('Total Money Spent', html);
}

function showTotalDueDetails() {
    const totalDue = data.materials.reduce((sum, item) => sum + item.due, 0);
    const items = data.materials.filter(item => item.due > 0);
    let html = '';
    if (!items.length) {
        html = '<p class="due-empty">No outstanding due details found.</p>';
    } else {
        items.forEach(item => {
            html += `<div class="due-item">
                <div class="due-meta">
                    <span class="due-date">${item.date}</span>
                    <span class="due-name">${item.buyer} / ${item.materialName}</span>
                </div>
                <span class="due-amount">Due $${Number(item.due).toLocaleString()}</span>
            </div>`;
        });
    }
    html += `<div class="due-total">Total Due: $${totalDue.toFixed(2)}</div>`;
    showDetailsHTML('Total Due', html);
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
