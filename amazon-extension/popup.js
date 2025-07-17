document.getElementById('searchBtn').addEventListener('click', async () => {
  const query = document.getElementById('productInput').value;
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = 'Searching...';

  try {
    const res = await fetch(`http://localhost:3000/scrape?q=${encodeURIComponent(query)}`);
    const products = await res.json();

    if (products.length === 0) {
      resultsDiv.innerHTML = 'No products found.';
    } else {
      resultsDiv.innerHTML = products.map(p => `
        <div style="margin-bottom: 10px;">
          <strong>${p.title}</strong><br/>
          ₹${p.price}<br/>
          <a href="${p.link}" target="_blank">View</a>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = 'Error fetching data.';
  }
});
