function downloadCSV(filename, csvContent) {
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function uploadCSV() {
    return new Promise((resolve, reject) => {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';

        input.onchange = e => {
            var file = e.target.files[0];
            var reader = new FileReader();

            reader.onload = event => {
                resolve(event.target.result);
            };

            reader.onerror = error => {
                reject(error);
            };

            reader.readAsText(file);
        };

        input.click();
    });
}

// Expose functiosn to global scope
window.downloadCSV = downloadCSV;
window.uploadCSV = uploadCSV;
