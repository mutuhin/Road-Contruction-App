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

    // Payment form
    const paymentTypeInput = document.getElementById('paymentType');
    const paymentDetailsInput = document.getElementById('paymentDetails');

    function updatePaymentDetailsRequirements() {
        if (paymentTypeInput.value === 'cash') {
            paymentDetailsInput.placeholder = 'Details optional for cash';
        } else {
            paymentDetailsInput.placeholder = 'Cheque/NPSB/Number';
        }
    }

    paymentTypeInput.addEventListener('change', updatePaymentDetailsRequirements);
    updatePaymentDetailsRequirements();

    document.getElementById('paymentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const type = paymentTypeInput.value;
        let details = paymentDetailsInput.value.trim();
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const imageFile = document.getElementById('paymentImage').files[0];
        if (type !== 'cash' && !details) {
            alert('Please enter payment details for non-cash payments.');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid payment amount.');
            return;
        }
        addPayment(type, details, amount, imageFile);
        this.reset();
        updatePaymentDetailsRequirements();
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

    // Export data button
    document.getElementById('exportDataBtn').addEventListener('click', function() {
        exportData();
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
    expenses: []
};

function loadData() {
    const stored = localStorage.getItem(DATABASE_KEY);
    if (stored) {
        data = JSON.parse(stored);
    }
    displayData();
}

function saveData() {
    localStorage.setItem(DATABASE_KEY, JSON.stringify(data));
}

function exportData() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'road_construction_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

function displayLabour() {
    const list = document.getElementById('labourList');
    list.innerHTML = '';
    data.labour.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${item.name} - ${item.date} - $${item.money} <button class="delete-btn" data-type="labour" data-index="${index}">×</button>`;
        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete')) return;
            showLabourDetails(item.name);
        });
        list.appendChild(li);
    });
}

function displayMaterials() {
    const list = document.getElementById('materialList');
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
        li.innerHTML = `${item.name} - ${item.date} - $${item.amount} (${item.paymentType}) <button class="delete-btn" data-type="engineers" data-index="${index}">×</button>`;
        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete')) return;
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
        li.innerHTML = `${item.description} - ${item.date} - $${item.amount} <button class="delete-btn" data-type="expenses" data-index="${index}">×</button>`;
        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete')) return;
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
            li.addEventListener('click', () => {
                showEntityDetails(type, name);
            });
            list.appendChild(li);
        });
    };

    addEntities('labour', 'Labour', data.labour.map(item => item.name));
    addEntities('engineer', 'Engineer', data.engineers.map(item => item.name));
    addEntities('buyer', 'Buyer', data.materials.map(item => item.buyer));
    addEntities('material', 'Material', data.materials.map(item => item.materialName));
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
