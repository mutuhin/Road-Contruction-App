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

    function updateDue() {
        const bill = parseFloat(billInput.value) || 0;
        const paid = parseFloat(paidInput.value) || 0;
        const due = calculateDue(bill, paid);
        dueInput.value = due.toFixed(2);
    }

    billInput.addEventListener('input', updateDue);
    paidInput.addEventListener('input', updateDue);

    document.getElementById('materialForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const buyer = document.getElementById('buyerName').value.trim();
        const materialName = document.getElementById('materialName').value.trim();
        const date = document.getElementById('materialDate').value;
        const bill = parseFloat(document.getElementById('billAmount').value);
        const quantity = document.getElementById('quantity').value.trim();
        const paid = parseFloat(document.getElementById('paidAmount').value);
        const due = calculateDue(bill, paid);
        if (!buyer || !materialName || !date || isNaN(bill) || bill < 0 || !quantity || isNaN(paid) || paid < 0 || paid > bill) {
            alert('Please enter valid data. Paid amount must be between 0 and bill amount.');
            return;
        }
        addMaterial(buyer, materialName, date, bill, quantity, paid, due);
        this.reset();
        dueInput.value = '';
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

    // Entity help link
    const entityHelpLink = document.getElementById('entityHelpLink');
    if (entityHelpLink) {
        entityHelpLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('entityList').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

function addMaterial(buyer, materialName, date, bill, quantity, paid, due) {
    data.materials.push({ buyer, materialName, date, bill, quantity, paid, due });
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
    document.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const index = parseInt(this.getAttribute('data-index'));
            deleteItem(type, index);
        });
    });
}

function displayLabour() {
    const list = document.getElementById('labourList');
    list.innerHTML = '';
    data.labour.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${item.name} - ${item.date} - $${item.money} <button class="delete" data-type="labour" data-index="${index}">Delete</button>`;
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
        li.innerHTML = `${item.buyer} - ${item.materialName} - ${item.date} - Bill: $${item.bill}, Paid: $${item.paid}, Due: $${item.due} <button class="delete" data-type="materials" data-index="${index}">Delete</button>`;
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
        li.innerHTML = `${item.type} - ${item.details} - $${item.amount} <button class="delete" data-type="payments" data-index="${index}">Delete</button>`;
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
        li.innerHTML = `${item.name} - ${item.date} - $${item.amount} (${item.paymentType}) <button class="delete" data-type="engineers" data-index="${index}">Delete</button>`;
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
        li.innerHTML = `${item.description} - ${item.date} - $${item.amount} <button class="delete" data-type="expenses" data-index="${index}">Delete</button>`;
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
    const labourData = data.labour.filter(item => item.name === name);
    const totalPaid = labourData.reduce((sum, item) => sum + item.money, 0);
    let details = `${name} - Total Paid: $${totalPaid.toFixed(2)}\n\nPayments:\n`;
    labourData.forEach(item => {
        details += `${item.date}: $${item.money}\n`;
    });
    alert(details);
}

function showMaterialDetails(buyer, materialName) {
    const materialData = data.materials.filter(item => item.buyer === buyer && item.materialName === materialName);
    const totalPaid = materialData.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = materialData.reduce((sum, item) => sum + item.due, 0);
    let details = `${buyer} - ${materialName} - Total Paid: $${totalPaid.toFixed(2)}, Total Due: $${totalDue.toFixed(2)}\n\nTransactions:\n`;
    materialData.forEach(item => {
        details += `${item.date}: Bill $${item.bill}, Paid $${item.paid}, Due $${item.due}, Quantity: ${item.quantity}\n`;
    });
    alert(details);
}

function showEngineerDetails(name) {
    const engineerData = data.engineers.filter(item => item.name === name);
    const totalPaid = engineerData.reduce((sum, item) => sum + item.amount, 0);
    let details = `${name} - Total Paid: $${totalPaid.toFixed(2)}\n\nPayments:\n`;
    engineerData.forEach(item => {
        details += `${item.date}: $${item.amount} (${item.paymentType})\n`;
    });
    alert(details);
}

function showPaymentDetails(index) {
    const payment = data.payments[index];
    alert(`Payment Details:\nType: ${payment.type}\nDetails: ${payment.details}\nAmount: $${payment.amount}`);
}

function showBuyerDetails(buyer) {
    const materialData = data.materials.filter(item => item.buyer === buyer);
    if (!materialData.length) {
        alert('No raw materials found for this buyer.');
        return;
    }
    const totalPaid = materialData.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = materialData.reduce((sum, item) => sum + item.due, 0);
    let details = `${buyer} - Total Paid: $${totalPaid.toFixed(2)}, Total Due: $${totalDue.toFixed(2)}\n\nTransactions:\n`;
    materialData.forEach(item => {
        details += `${item.date}: ${item.materialName}, Bill $${item.bill}, Paid $${item.paid}, Due $${item.due}, Quantity: ${item.quantity}\n`;
    });
    alert(details);
}

function showMaterialNameDetails(name) {
    const materialData = data.materials.filter(item => item.materialName === name);
    if (!materialData.length) {
        alert('No raw materials found for this material name.');
        return;
    }
    const totalPaid = materialData.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = materialData.reduce((sum, item) => sum + item.due, 0);
    let details = `${name} - Total Paid: $${totalPaid.toFixed(2)}, Total Due: $${totalDue.toFixed(2)}\n\nTransactions:\n`;
    materialData.forEach(item => {
        details += `${item.date}: Buyer ${item.buyer}, Bill $${item.bill}, Paid $${item.paid}, Due $${item.due}, Quantity: ${item.quantity}\n`;
    });
    alert(details);
}

function showEngineerDetails(name) {
    const engineerData = data.engineers.filter(item => item.name === name);
    const totalPaid = engineerData.reduce((sum, item) => sum + item.amount, 0);
    let details = `${name} - Total Paid: $${totalPaid.toFixed(2)}\n\nPayments:\n`;
    engineerData.forEach(item => {
        details += `${item.date}: $${item.amount} (${item.paymentType})\n`;
    });
    alert(details);
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
    alert(`Expense Details:\nDescription: ${expense.description}\nDate: ${expense.date}\nAmount: $${expense.amount}`);
}
