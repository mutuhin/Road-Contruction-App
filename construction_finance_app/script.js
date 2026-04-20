document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateDashboard();

    // Labour form
    document.getElementById('labourForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('labourName').value;
        const date = document.getElementById('labourDate').value;
        const money = parseFloat(document.getElementById('labourMoney').value);
        addLabour(name, date, money);
        this.reset();
    });

    // Material form
    document.getElementById('materialForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const buyer = document.getElementById('buyerName').value;
        const date = document.getElementById('materialDate').value;
        const bill = parseFloat(document.getElementById('billAmount').value);
        const quantity = document.getElementById('quantity').value;
        const paid = parseFloat(document.getElementById('paidAmount').value);
        const due = parseFloat(document.getElementById('dueAmount').value);
        addMaterial(buyer, date, bill, quantity, paid, due);
        this.reset();
    });

    // Payment form
    document.getElementById('paymentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const type = document.getElementById('paymentType').value;
        const details = document.getElementById('paymentDetails').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const imageFile = document.getElementById('paymentImage').files[0];
        addPayment(type, details, amount, imageFile);
        this.reset();
    });

    // Engineer form
    document.getElementById('engineerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('engineerName').value;
        const date = document.getElementById('engineerDate').value;
        const amount = parseFloat(document.getElementById('engineerAmount').value);
        const paymentType = document.getElementById('engineerPaymentType').value;
        addEngineer(name, date, amount, paymentType);
        this.reset();
    });

    // Expense form
    document.getElementById('expenseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const description = document.getElementById('expenseDescription').value;
        const date = document.getElementById('expenseDate').value;
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        addExpense(description, date, amount);
        this.reset();
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
    const stored = localStorage.getItem('constructionData');
    if (stored) {
        data = JSON.parse(stored);
    }
    displayData();
}

function saveData() {
    localStorage.setItem('constructionData', JSON.stringify(data));
}

function addLabour(name, date, money) {
    data.labour.push({ name, date, money });
    saveData();
    displayData();
    updateDashboard();
}

function addMaterial(buyer, date, bill, quantity, paid, due) {
    data.materials.push({ buyer, date, bill, quantity, paid, due });
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
}

function displayLabour() {
    const list = document.getElementById('labourList');
    list.innerHTML = '';
    data.labour.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - ${item.date} - $${item.money}`;
        li.addEventListener('click', () => showLabourDetails(item.name));
        list.appendChild(li);
    });
}

function displayMaterials() {
    const list = document.getElementById('materialList');
    list.innerHTML = '';
    data.materials.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.buyer} - ${item.date} - Bill: $${item.bill}, Paid: $${item.paid}, Due: $${item.due}`;
        li.addEventListener('click', () => showMaterialDetails(item.buyer));
        list.appendChild(li);
    });
}

function displayPayments() {
    const list = document.getElementById('paymentList');
    list.innerHTML = '';
    data.payments.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.type} - ${item.details} - $${item.amount}`;
        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.style.width = '50px';
            img.style.height = '50px';
            li.appendChild(img);
        }
        list.appendChild(li);
    });
}

function displayEngineers() {
    const list = document.getElementById('engineerList');
    list.innerHTML = '';
    data.engineers.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - ${item.date} - $${item.amount} (${item.paymentType})`;
        li.addEventListener('click', () => showEngineerDetails(item.name));
        list.appendChild(li);
    });
}

function displayExpenses() {
    const list = document.getElementById('expenseList');
    list.innerHTML = '';
    data.expenses.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.description} - ${item.date} - $${item.amount}`;
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
    alert(`${name}: Total Paid: $${totalPaid.toFixed(2)}`);
}

function showMaterialDetails(buyer) {
    const materialData = data.materials.filter(item => item.buyer === buyer);
    const totalPaid = materialData.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = materialData.reduce((sum, item) => sum + item.due, 0);
    alert(`${buyer}: Total Paid: $${totalPaid.toFixed(2)}, Total Due: $${totalDue.toFixed(2)}`);
}

function showEngineerDetails(name) {
    const engineerData = data.engineers.filter(item => item.name === name);
    const totalPaid = engineerData.reduce((sum, item) => sum + item.amount, 0);
    alert(`${name}: Total Paid: $${totalPaid.toFixed(2)}`);
}