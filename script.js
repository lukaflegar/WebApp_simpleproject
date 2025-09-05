
const products = [
    'Deterdzent za rublje', 'Energetski napitak', 'Kava', 'Mlijeko',
    'Pivo', 'Proteinska plocica', 'Suncokretovo ulje', 'Tjestenina',
    'Toaletni papir', 'Voda'
];

let sortAsc = true;

// Funkcija za pretvaranje naziva u naziv datoteke
function getImageFileName(productName) {
    return productName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

// Funkcija za pronalaženje slike u različitim formatima
function createImageElement(productName, index) {
    const baseName = getImageFileName(productName);
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    const img = document.createElement('img');
    img.className = 'product-image';
    img.alt = productName;
    
    let currentExtensionIndex = 0;
    
    function tryNextExtension() {
        if (currentExtensionIndex >= extensions.length) {
            // Ako nijedna ekstenzija ne radi, prikaži placeholder
            img.style.display = 'none';
            img.nextElementSibling.style.display = 'flex';
            return;
        }
        
        img.src = `images/${baseName}.${extensions[currentExtensionIndex]}`;
        currentExtensionIndex++;
    }
    
    img.onerror = tryNextExtension;
    
    // Počni s prvom ekstenzijom
    tryNextExtension();
    
    return img;
}

function initializeTable() {
    const tableBody = document.getElementById('tableBody');
    products.forEach((product, index) => {
        const row = document.createElement('tr');
        row.id = `row_${index}`;

        // Stvori ćeliju za proizvod
        const productCell = document.createElement('td');
        const productDiv = document.createElement('div');
        productDiv.className = 'product-cell';

        // Stvori sliku sa automatskim pokušavanjem različitih formata
        const img = createImageElement(product, index);

        // Stvori placeholder za slučaj kada slika ne postoji
        const noImageDiv = document.createElement('div');
        noImageDiv.className = 'no-image';
        noImageDiv.style.display = 'none';
        noImageDiv.innerHTML = 'No<br>IMG';

        // Stvori naziv
        const nameSpan = document.createElement('span');
        nameSpan.className = 'product-name';
        nameSpan.textContent = product;

        // Dodaj sve elemente
        productDiv.appendChild(img);
        productDiv.appendChild(noImageDiv);
        productDiv.appendChild(nameSpan);
        productCell.appendChild(productDiv);
        row.appendChild(productCell);

        // Dodaj OOS stupac
        const oosCell = document.createElement('td');
        oosCell.className = 'oos-cell';
        oosCell.innerHTML = `<input type="checkbox" class="oos-checkbox" id="oos_${index}" onchange="updateOOSStatus(${index})">`;
        row.appendChild(oosCell);

        // Dodaj ostale stupce
        for (let i = 1; i <= 5; i++) {
            const td = document.createElement('td');
            td.innerHTML = `<input type="number" class="quantity-input" id="b${i}_${index}" min="0" step="0.5" onchange="updateRowTotal(${index})">`;
            row.appendChild(td);
        }

        const totalCell = document.createElement('td');
        totalCell.className = 'total-cell';
        totalCell.id = `total_${index}`;
        totalCell.textContent = '0';
        row.appendChild(totalCell);

        tableBody.appendChild(row);
    });
}

function updateOOSStatus(index) {
    const row = document.getElementById(`row_${index}`);
    const checkbox = document.getElementById(`oos_${index}`);
    
    if (checkbox.checked) {
        row.classList.add('oos-row');
    } else {
        row.classList.remove('oos-row');
    }
    
    updateOOSSummary();
}

function updateOOSSummary() {
    let oosCount = 0;
    products.forEach((_, index) => {
        if (document.getElementById(`oos_${index}`).checked) {
            oosCount++;
        }
    });
    document.getElementById('oosSummary').textContent = `OOS proizvodi: ${oosCount}`;
}

function updateRowTotal(index) {
    let total = 0;
    for (let i = 1; i <= 5; i++) {
        const val = parseFloat(document.getElementById(`b${i}_${index}`).value) || 0;
        total += val;
    }
    document.getElementById(`total_${index}`).textContent = total;
    
    const row = document.getElementById(`row_${index}`);
    row.classList.toggle('zero-row', total === 0 && !document.getElementById(`oos_${index}`).checked);
    
    updateGrandTotal();
}

function updateGrandTotal() {
    let total = 0;
    products.forEach((_, index) => {
        total += parseFloat(document.getElementById(`total_${index}`).textContent) || 0;
    });
    document.getElementById('totalSummary').textContent = `Ukupno napunjeno: ${total} paketa`;
}

function calculateTotal() {
    products.forEach((_, index) => updateRowTotal(index));
    // Automatski sortiraj po količini nakon izračuna
    setTimeout(() => {
        sortTableByTotal(true); // true = sortiranje od najveće prema najmanjoj
    }, 100);
}

function clearAll() {
    if (confirm('Jeste li sigurni da želite obrisati sve podatke?')) {
        products.forEach((_, index) => {
            for (let i = 1; i <= 5; i++) {
                document.getElementById(`b${i}_${index}`).value = '';
            }
            document.getElementById(`oos_${index}`).checked = false;
            document.getElementById(`total_${index}`).textContent = '0';
            const row = document.getElementById(`row_${index}`);
            row.classList.remove('oos-row');
            row.classList.add('zero-row');
        });
        updateGrandTotal();
        updateOOSSummary();
    }
}

function sortTableByTotal(forceDescending = false) {
    const tbody = document.getElementById('tableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Ako je forceDescending true, uvijek sortiraj od najveće prema najmanjoj
    const shouldSortDesc = forceDescending ? true : !sortAsc;
    
    rows.sort((a, b) => {
        const aVal = parseFloat(a.querySelector('.total-cell').textContent) || 0;
        const bVal = parseFloat(b.querySelector('.total-cell').textContent) || 0;
        return shouldSortDesc ? bVal - aVal : aVal - bVal;
    });
    
    rows.forEach(row => tbody.appendChild(row));
    
    // Ažuriraj sortAsc samo ako nije forsirano sortiranje
    if (!forceDescending) {
        sortAsc = !sortAsc;
    }
}

async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const store = document.getElementById("storeName").value || "Trgovina";
    const pos = document.getElementById("posCode").value || "POS";

    doc.setFontSize(16);
    doc.text(`ZALIHE product`, 10, 15);
    doc.setFontSize(12);
    doc.text(`Trgovina: ${store}`, 10, 25);
    doc.text(`POS kod: ${pos}`, 10, 32);
    doc.text(`Datum: ${new Date().toLocaleDateString('hr-HR')}`, 10, 39);

    let y = 50;
    
    // Dodaj naslov za potrebne količine
    doc.setFontSize(14);
    doc.text('NAPUNJENO:', 10, y);
    y += 10;
    
    doc.setFontSize(10);
    let hasItems = false;
    products.forEach((product, index) => {
        const total = document.getElementById(`total_${index}`).textContent;
        if (parseFloat(total) > 0) {
            doc.text(`${product}: ${total} paketa`, 15, y);
            y += 6;
            hasItems = true;
        }
    });
    
    if (!hasItems) {
        doc.text('Nema potrebnih količina', 15, y);
        y += 6;
    }
    
    // Dodaj OOS proizvode
    y += 10;
    doc.setFontSize(14);
    doc.text('OUT OF STOCK (OOS):', 10, y);
    y += 10;
    
    doc.setFontSize(10);
    let hasOOS = false;
    products.forEach((product, index) => {
        if (document.getElementById(`oos_${index}`).checked) {
            doc.text(`• ${product}`, 15, y);
            y += 6;
            hasOOS = true;
        }
    });
    
    if (!hasOOS) {
        doc.text('Nema OOS proizvoda', 15, y);
        y += 6;
    }
    
    // Dodaj sažetak
    y += 10;
    doc.setFontSize(12);
    const grandTotal = document.getElementById('totalSummary').textContent;
    const oosTotal = document.getElementById('oosSummary').textContent;
    doc.text(`SAŽETAK:`, 10, y);
    y += 8;
    doc.text(`${grandTotal}`, 15, y);
    y += 6;
    doc.text(`${oosTotal}`, 15, y);
    
    doc.save(`zalihe_${store.replace(/\s+/g, '_')}_${pos}_${new Date().toISOString().split('T')[0]}.pdf`);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTable();
});
