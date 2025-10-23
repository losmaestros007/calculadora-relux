<script>
/* Relux Calculadora - inicialización robusta (para AlterEstate) */
(function () {
  function initReluxCalculadora() {
    try {
      var container = document.getElementById('relux-calculator');
      if (!container) return false;

      // util
      function qs(id){ return document.getElementById(id); }
      function qsa(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

      // elementos
      var form = qs('investmentForm');
      var tabButtons = qsa('[data-tab]');
      var tabs = qsa('.tab-content');

      // si faltan elementos regresamos false para intentar de nuevo más tarde
      if (!form || !tabButtons.length || !tabs.length) return false;

      // init helpers
      function showTab(tabName){
        tabs.forEach(function(t){
          var should = t.id === (tabName + '-tab');
          t.style.display = should ? '' : 'none';
        });
        tabButtons.forEach(function(b){
          b.classList.toggle('tab-active', b.dataset.tab === tabName);
          b.setAttribute('aria-pressed', b.dataset.tab === tabName ? 'true' : 'false');
        });
      }

      function updateCurrencyLabels(){
        var c = (qs('currency') && qs('currency').value === 'DOP') ? 'RD$' : 'US$';
        ['propertyPriceCurrency','renovationCurrency','rentCurrency','expensesCurrency','currentValueCurrency','setupCurrency']
          .forEach(function(id){ var el = qs(id); if(el) el.textContent = '(' + c + ')'; });
      }

      function toggleTypeUI(){
        var type = qs('evaluationType') ? qs('evaluationType').value : 'full-investment';
        var purchase = qs('purchaseFields');
        var rental = qs('rentalOnlyFields');
        if (purchase) purchase.style.display = (type === 'full-investment' ? '' : 'none');
        if (rental) rental.style.display = (type === 'rental-only' ? '' : 'none');
      }

      // bind tabs
      tabButtons.forEach(function(btn){ btn.addEventListener('click', function(){ showTab(btn.dataset.tab); }); });

      // bind change events
      if (qs('currency')) qs('currency').addEventListener('change', updateCurrencyLabels);
      if (qs('evaluationType')) qs('evaluationType').addEventListener('change', toggleTypeUI);

      // inicial
      updateCurrencyLabels();
      toggleTypeUI();
      showTab('calculator');

      // submit handler
      form.addEventListener('submit', function(e){
        e.preventDefault();
        try {
          var type = qs('evaluationType') ? qs('evaluationType').value : 'full-investment';
          var currency = qs('currency') ? qs('currency').value : 'USD';

          var totalInv = 0, valProp = 0;
          if (type === 'full-investment') {
            var precio = parseFloat(qs('propertyPrice').value) || 0;
            var downPct = parseFloat(qs('downPayment').value) || 0;
            var inicial = downPct / 100;
            var gastos = parseFloat(qs('renovationCost').value) || 0;
            totalInv = (precio * inicial) + gastos;
            valProp = precio;
          } else {
            valProp = parseFloat(qs('currentPropertyValue').value) || 0;
            totalInv = parseFloat(qs('setupCost').value) || 0;
          }

          var renta = parseFloat(qs('monthlyRent').value) || 0;
          var ocup = (parseFloat(qs('occupancyRate').value) || 0) / 100;
          var gastosMens = parseFloat(qs('monthlyExpenses').value) || 0;

          var ingresoNeto = (renta * ocup) - gastosMens;
          var flujoAnual = ingresoNeto * 12;

          var roi = totalInv > 0 ? (flujoAnual / totalInv) * 100 : 0;
          var capRate = valProp > 0 ? (flujoAnual / valProp) * 100 : 0;
          var payback = ingresoNeto > 0 ? (totalInv / (ingresoNeto * 12)) : Infinity;

          var symbol = (currency === 'DOP') ? 'RD$' : 'US$';
          if (qs('roiMetric')) qs('roiMetric').textContent = roi.toFixed(1) + '%';
          if (qs('cashFlowMetric')) qs('cashFlowMetric').textContent = symbol + ' ' + Math.round(ingresoNeto).toLocaleString();
          if (qs('capRateMetric')) qs('capRateMetric').textContent = capRate.toFixed(1) + '%';
          if (qs('paybackMetric')) qs('paybackMetric').textContent = isFinite(payback) ? payback.toFixed(1) : '∞';
          if (qs('roiDisplay')) qs('roiDisplay').textContent = roi.toFixed(1) + '%';

          var desc = 'Baja rentabilidad (ROI < 8%)', color = '#ef4444';
          if (roi >= 8 && roi < 12) { desc = 'Rentabilidad media (8% - 12%)'; color = '#f59e0b'; }
          else if (roi >= 12) { desc = 'Rentabilidad alta (ROI ≥ 12%)'; color = '#10b981'; }

          var widthPct = Math.min(Math.max(roi, 0), 20) * 5;
          if (qs('profitabilityBar')) {
            qs('profitabilityBar').style.width = widthPct + '%';
            qs('profitabilityBar').style.background = color;
          }
          if (qs('profitabilityText')) qs('profitabilityText').textContent = desc;

          showTab('results');
        } catch (err) {
          console.error('Relux calculadora error en submit:', err);
          alert('Error en el cálculo. Revisa la consola.');
        }
      });

      // todo correcto
      return true;

    } catch (e) {
      console.error('Relux calculadora init error:', e);
      return false;
    }
  }

  // Intento inmediato
  if (initReluxCalculadora()) {
    // inicializado bien
  } else {
    // si no está aún inyectado el HTML por el builder: observador que intenta inicializar cuando aparezca
    var observer = new MutationObserver(function(mutations, obs){
      if (document.getElementById('relux-calculator')) {
        if (initReluxCalculadora()) {
          obs.disconnect();
        }
      }
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
    // fallback: reintento tras 1.5s (por si el observer no detecta)
    setTimeout(function(){ if (!document.getElementById('relux-calculator')) { console.warn('Relux: contenedor no detectado tras 1.5s'); } }, 1500);
  }
})();
</script>