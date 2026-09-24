import React, { useMemo, useState } from 'react';
import './App.css';

const cars = [
  {
    id: 1,
    brand: 'BMW',
    model: 'M3 Competition',
    year: 2024,
    price: 89500,
    fuel: 'Essence',
    mileage: '18 000 km',
    status: 'Disponible',
    color: 'Noir',
    image:
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    brand: 'Audi',
    model: 'RS5 Sportback',
    year: 2023,
    price: 76900,
    fuel: 'Diesel',
    mileage: '22 500 km',
    status: 'À visiter',
    color: 'Gris',
    image:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    brand: 'Mercedes',
    model: 'AMG C 63',
    year: 2022,
    price: 68200,
    fuel: 'Essence',
    mileage: '31 200 km',
    status: 'Nouveau',
    color: 'Blanc',
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    brand: 'Porsche',
    model: '911 Carrera',
    year: 2021,
    price: 99800,
    fuel: 'Essence',
    mileage: '16 800 km',
    status: 'Très demandé',
    color: 'Rouge',
    image:
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=900&q=80',
  },
];

function App() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredCars = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return cars.filter((car) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${car.brand} ${car.model}`.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'sport' && ['BMW', 'Audi', 'Porsche', 'Mercedes'].includes(car.brand)) ||
        (filter === 'petrol' && car.fuel === 'Essence') ||
        (filter === 'diesel' && car.fuel === 'Diesel');

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Garage premium</p>
          <h1>CarSpot</h1>
        </div>
        <button type="button" className="primary-btn">
          Ajouter un véhicule
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="status-pill">+ 24 % ce mois-ci</span>
          <h2>Des voitures rares, prêtes à rouler.</h2>
          <p>
            Trouvez le modèle idéal parmi nos véhicules sélectionnés et vérifiés.
          </p>
        </div>

        <div className="hero-panel">
          <p>Prix moyen</p>
          <strong>€78.4k</strong>
          <span>Sur 4 véhicules disponibles</span>
        </div>
      </section>

      <section className="stats-grid" aria-label="Statistiques CarSpot">
        <article>
          <span>Véhicules</span>
          <strong>{cars.length}</strong>
        </article>
        <article>
          <span>En stock</span>
          <strong>92%</strong>
        </article>
        <article>
          <span>Clients satisfaits</span>
          <strong>1.4k</strong>
        </article>
      </section>

      <section className="toolbar" aria-label="Recherche et filtres de véhicules">
        <label className="search-box" htmlFor="car-search">
          <span>Rechercher</span>
          <input
            id="car-search"
            type="text"
            placeholder="BMW, Audi, Porsche..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="filters" role="tablist" aria-label="Filtres de véhicules">
          <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            Tous
          </button>
          <button type="button" className={filter === 'sport' ? 'active' : ''} onClick={() => setFilter('sport')}>
            Sport
          </button>
          <button type="button" className={filter === 'petrol' ? 'active' : ''} onClick={() => setFilter('petrol')}>
            Essence
          </button>
          <button type="button" className={filter === 'diesel' ? 'active' : ''} onClick={() => setFilter('diesel')}>
            Diesel
          </button>
        </div>
      </section>

      <section className="car-grid" aria-live="polite">
        {filteredCars.length === 0 ? (
          <div className="empty-state">
            <h3>Aucun véhicule ne correspond à votre recherche.</h3>
            <p>Essayez un autre mot-clé ou réinitialisez le filtre.</p>
          </div>
        ) : (
          filteredCars.map((car) => (
            <article className="car-card" key={car.id}>
              <img src={car.image} alt={`${car.brand} ${car.model}`} />
              <div className="car-card-body">
                <div className="card-topline">
                  <span className="chip">{car.status}</span>
                  <span>{car.year}</span>
                </div>

                <h3>
                  {car.brand} {car.model}
                </h3>

                <div className="meta-row">
                  <span>{car.fuel}</span>
                  <span>{car.mileage}</span>
                  <span>{car.color}</span>
                </div>

                <div className="card-footer">
                  <strong>€{car.price.toLocaleString('fr-FR')}</strong>
                  <button type="button">Voir le véhicule</button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default App;
