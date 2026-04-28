(function () {
  const HABITS_INIT = [
    { id: 'h1', name: 'Morning Run',     category: 'fitness',      freq: 'daily',    targetDays: 7, active: true },
    { id: 'h2', name: 'Read 20 min',     category: 'learning',     freq: 'daily',    targetDays: 7, active: true },
    { id: 'h3', name: 'Meditate',        category: 'health',       freq: 'daily',    targetDays: 7, active: true },
    { id: 'h4', name: 'Drink 2L Water',  category: 'health',       freq: 'daily',    targetDays: 7, active: true },
    { id: 'h5', name: 'No Phone AM',     category: 'productivity', freq: 'daily',    targetDays: 7, active: true },
    { id: 'h6', name: 'Code Practice',   category: 'learning',     freq: '5×/week',  targetDays: 5, active: true },
  ];

  const CATEGORIES = {
    fitness:      { label: 'Fitness',       color: '#c9614a' },
    health:       { label: 'Health',        color: '#6a9e7a' },
    learning:     { label: 'Learning',      color: '#d4933a' },
    productivity: { label: 'Productivity',  color: '#4a8fa8' },
  };

  // Per-habit reliability rates (for realistic dummy data)
  const RATES = { h1: 0.68, h2: 0.87, h3: 0.61, h4: 0.90, h5: 0.74, h6: 0.79 };

  function seededRand(seed) {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }

  function generateCompletions() {
    const completions = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 89; d >= 1; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const key = date.toISOString().slice(0, 10);
      completions[key] = [];
      HABITS_INIT.forEach((h, hi) => {
        if (seededRand(d * 17 + hi * 31) < RATES[h.id]) {
          completions[key].push(h.id);
        }
      });
    }
    // Today: empty so user can check in
    const todayKey = today.toISOString().slice(0, 10);
    completions[todayKey] = [];
    return completions;
  }

  window.TRACKWISE_INIT = {
    habits: HABITS_INIT,
    categories: CATEGORIES,
    completions: generateCompletions(),
  };
})();
