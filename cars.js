// Utilisation navigateur classique : db et auth sont sur window
const db = window.db;
const auth = window.auth;

window.renderCarsPageImpl = function renderCarsPage() {
  // Ne réécrit le HTML que si la structure n'est pas déjà présente
  const appContent = document.getElementById('app-content');
  if (!document.getElementById('cars-grid')) {
    appContent.innerHTML = `
      <h2>Mes voitures</h2>
      <div style="margin-bottom:10px;">
        <input id="search-car" type="text" placeholder="Rechercher un modèle..." style="width:100%;padding:10px;border-radius:8px;border:1px solid #ccc;">
      </div>
      <div style="margin-bottom:16px;">
        <select id="sort-car" style="width:100%;padding:10px;border-radius:8px;">
          <option value="date-desc">Plus récentes</option>
          <option value="date-asc">Plus anciennes</option>
          <option value="alpha-asc">A → Z</option>
          <option value="alpha-desc">Z → A</option>
        </select>
      </div>
      <div id="cars-grid" class="grid"></div>
    `;
  }
  if (window.applyStoredBg) window.applyStoredBg();

  let allCars = [];
  let filteredCars = [];

  function renderGrid(errorMsg) {
    const container = document.getElementById('cars-grid');
    container.innerHTML = '';
    if (errorMsg) {
      container.innerHTML = `<p style='color:red;'>${errorMsg}</p>`;
      return;
    }
    if (filteredCars.length === 0) {
      container.innerHTML = '<p style="color:#888;">Aucune voiture trouvée.</p>';
      return;
    }

    filteredCars.forEach(carObj => {
      const { doc, car } = carObj;
      const div = document.createElement('div');
      div.className = 'car-inline-container';
      div.innerHTML = `
        <div class="car-inline-content">
          <img src="${car.photoURL || car.miniature || (car.photos && car.photos[0]) || ''}" class="car-inline-photo">
          <span class="car-inline-model">${car.model || ''}</span>
          <button class="move-car-btn" data-id="${doc.id}" style="margin-left:8px;background:#007aff;color:#fff;border:none;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:1em;cursor:pointer;box-shadow:0 2px 8px #0001;transition:background 0.2s;">⇄</button>
          <button class="delete-car-btn" data-id="${doc.id}" style="margin-left:8px;background:#ff4444;color:#fff;border:none;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:1em;cursor:pointer;box-shadow:0 2px 8px #0001;transition:background 0.2s;">🗑️</button>
        </div>
      `;

      // Suppression voiture
      div.querySelector('.delete-car-btn').onclick = (e) => {
        e.stopPropagation();
        if (confirm('Supprimer cette voiture ?')) {
          db.collection('cars').doc(doc.id).delete();
        }
      };

      // Déplacement voiture
      div.querySelector('.move-car-btn').onclick = (e) => {
        e.stopPropagation();
        db.collection('lists').where('uid', '==', car.uid).get().then(snap => {
          let options = '';
          snap.forEach(listDoc => {
            options += `<option value="${listDoc.id}">${listDoc.data().name}</option>`;
          });
          const newList = prompt('ID de la nouvelle liste :\n' + options);
          if (newList) {
            db.collection('cars').doc(doc.id).update({ listId: newList });
          }
        });
      };

      div.onclick = (e) => {
        if (e.target.classList.contains('delete-car-btn') || e.target.classList.contains('move-car-btn')) return;
        openCarPopup(doc.id, car);
      };
      container.appendChild(div);
    });
  }

  // --- Popup voiture (en dehors de renderGrid pour plus de clarté) ---
  function openCarPopup(carId, car) {
    let modal = document.createElement('div');
    modal.className = 'modal-bg';
    let photos = Array.isArray(car.photos) ? car.photos : (car.photoURL ? [car.photoURL] : []);
    let miniature = car.miniature || (photos[0] || '');
    let currentPhoto = photos.indexOf(miniature) !== -1 ? photos.indexOf(miniature) : 0;

    function renderPhotos() {
        let html = '';
        if (photos.length > 0) {
            html += `<div style="position:relative; display:flex;align-items:center;justify-content:center;margin-bottom:10px;gap:8px;">
                <button type="button" id="prev-photo" style="font-size:1.5em;background:none;border:none;cursor:pointer;">◀️</button>
                <div style="position:relative; display:inline-block;">
                    <img src="${photos[currentPhoto]}" style="width:180px;max-width:90vw;height:120px;object-fit:cover;border-radius:10px;box-shadow:0 2px 8px #0002;">
                    <button type="button" id="zoom-photo" style="position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.5); color:white; border:none; border-radius:5px; cursor:pointer; padding:2px 5px; font-size:12px;">🔍</button>
                </div>
                <button type="button" id="next-photo" style="font-size:1.5em;background:none;border:none;cursor:pointer;">▶️</button>
            </div>`;
            html += `<div style="text-align:center;margin-bottom:8px;">${photos.map((p,i)=>`<span style='cursor:pointer;font-size:1.2em;${i===currentPhoto?'color:#007aff;':''}' data-idx='${i}'>●</span>`).join(' ')}</div>`;
            html += `<div style="text-align:center;margin-bottom:8px;"><button type="button" id="set-miniature" style="font-size:0.95em;${miniature===photos[currentPhoto]?'background:#007aff;color:#fff;':'background:#eee;'};border:none;padding:4px 10px;border-radius:8px;cursor:pointer;">Choisir comme miniature</button></div>`;
        } else {
            html = '<div style="text-align:center;color:#888;">Aucune photo</div>';
        }
        return html;
    }

    modal.innerHTML = `
        <div class="modal-content" style="position:relative; padding:24px; border-radius:16px; max-width:350px; width:90vw; background:white; box-shadow:0 8px 32px rgba(0,0,0,0.2);">
            <button id="close-modal" style="position: absolute; top: 15px; right: 15px; font-size: 2.2em; background: none; border: none; cursor: pointer; line-height: 1; z-index: 10;">✖️</button>
            <h3 style="margin-top:0;">Modifier la voiture</h3>
            <div id="photos-carousel">${renderPhotos()}</div>
            <form id="edit-car-form">
                <label>Modèle</label>
                <input type="text" id="edit-model" value="${car.model || ''}" required>
                <label>Description</label>
                <textarea id="edit-desc">${car.desc || ''}</textarea>
                <label>Ajouter des photos</label>
                <input type="file" id="edit-photo" accept="image/*" multiple>
                <button type="submit">Enregistrer</button>
            </form>
            <div id="edit-car-msg"></div>
        </div>
    `;

    Object.assign(modal.style, { position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' });
    document.body.appendChild(modal);

    modal.querySelector('#close-modal').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };

    modal.addEventListener('click', e => {
        if (e.target.id === 'prev-photo') {
            currentPhoto = (currentPhoto - 1 + photos.length) % photos.length;
            modal.querySelector('#photos-carousel').innerHTML = renderPhotos();
        }
        if (e.target.id === 'next-photo') {
            currentPhoto = (currentPhoto + 1) % photos.length;
            modal.querySelector('#photos-carousel').innerHTML = renderPhotos();
        }
        if (e.target.id === 'set-miniature') {
            miniature = photos[currentPhoto];
            modal.querySelector('#photos-carousel').innerHTML = renderPhotos();
        }
        if (e.target.dataset.idx) {
            currentPhoto = parseInt(e.target.dataset.idx);
            modal.querySelector('#photos-carousel').innerHTML = renderPhotos();
        }
        if (e.target.id === 'zoom-photo') {
            const fullScreenModal = document.createElement('div');
            fullScreenModal.style = 'position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.95); z-index:9999; display:flex; align-items:center; justify-content:center; cursor:zoom-in;';
            fullScreenModal.innerHTML = `
                <button id="close-zoom" style="position:absolute; top:20px; right:20px; color:white; background:none; border:none; font-size:2em; cursor:pointer; z-index:100;">✖️</button>
                <img id="zoom-img" src="${photos[currentPhoto]}" style="max-width:100vw; max-height:100vh; transition: transform 0.3s ease; object-fit:contain;">
            `;
            document.body.appendChild(fullScreenModal);
            const img = fullScreenModal.querySelector('#zoom-img');
            let zoomLevel = 1;
            img.onclick = (e) => {
                e.stopPropagation();
                zoomLevel = zoomLevel >= 3 ? 1 : zoomLevel + 1;
                img.style.transform = `scale(${zoomLevel})`;
                img.style.cursor = zoomLevel === 3 ? 'zoom-out' : 'zoom-in';
            };
            fullScreenModal.querySelector('#close-zoom').onclick = () => fullScreenModal.remove();
            fullScreenModal.onclick = (evt) => { if (evt.target === fullScreenModal) fullScreenModal.remove(); };
        }
    });

    modal.querySelector('#edit-car-form').onsubmit = async function(e) {
        e.preventDefault();
        const msg = modal.querySelector('#edit-car-msg');
        msg.innerText = 'Enregistrement...';
        let updates = {
            model: modal.querySelector('#edit-model').value,
            desc: modal.querySelector('#edit-desc').value,
            miniature
        };
        const files = modal.querySelector('#edit-photo').files;
        if (files && files.length > 0) {
            try {
                for (let i = 0; i < files.length; i++) {
                    const ref = storage.ref(`spots/${auth.currentUser.uid}/${Date.now()}_${files[i].name}`);
                    await ref.put(files[i]);
                    const url = await ref.getDownloadURL();
                    photos.push(url);
                }
                updates.photos = photos;
            } catch (err) {
                msg.innerText = 'Erreur upload photo : ' + err.message;
                return;
            }
        } else {
            updates.photos = photos;
        }
        db.collection('cars').doc(carId).update(updates).then(() => {
            msg.innerText = 'Modifié !';
            setTimeout(() => modal.remove(), 1000);
        }).catch(err => { msg.innerText = err.message; });
    };
  }

  function applyFilters() {
    const search = document.getElementById('search-car').value.toLowerCase();
    const sort = document.getElementById('sort-car').value;
    filteredCars = allCars.filter(({car}) => (car.model||'').toLowerCase().includes(search));
    if (sort === 'date-desc') filteredCars.sort((a,b) => (b.car.createdAt?.seconds||0)-(a.car.createdAt?.seconds||0));
    if (sort === 'date-asc') filteredCars.sort((a,b) => (a.car.createdAt?.seconds||0)-(b.car.createdAt?.seconds||0));
    if (sort === 'alpha-asc') filteredCars.sort((a,b) => (a.car.model||'').localeCompare(b.car.model||''));
    if (sort === 'alpha-desc') filteredCars.sort((a,b) => (b.car.model||'').localeCompare(a.car.model||''));
    renderGrid();
  }

  auth.onAuthStateChanged(user => {
    if (!user) {
      const grid = document.getElementById('cars-grid');
      if (grid) grid.innerHTML = "<p style='color:red;'>Connecte-toi pour voir tes voitures.</p>";
      return;
    }
    try {
      db.collection('cars').where('uid', '==', user.uid).orderBy('createdAt', 'desc').onSnapshot(snap => {
        const tempCars = [];
        snap.forEach(doc => {
          const car = doc.data();
          tempCars.push({ doc, car });
        });
        allCars = tempCars;
        applyFilters();
      }, err => {
        console.error('Erreur Firestore:', err);
        renderGrid('Erreur Firestore : ' + err.message);
      });
    } catch (e) {
      console.error('Erreur JS:', e);
      renderGrid('Erreur JS : ' + e.message);
    }
  });

  document.addEventListener('input', e => {
    if (e.target && (e.target.id === 'search-car' || e.target.id === 'sort-car')) {
      applyFilters();
    }
  });
}