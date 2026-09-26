// Utilisation des objets globaux exposés par firebase-config.js

window.onload = () => { // This window.onload might conflict with DOMContentLoaded in main.js if main.js is also loaded
  auth.onAuthStateChanged(user => { // Utilise auth importé
    if (!user) return;
    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('id');
    if (listId) {
      // Afficher les voitures de la liste
      renderCarsOfList(listId, user.uid);
    } else {
      // Afficher les listes
      db.collection('lists').where('uid', '==', user.uid).onSnapshot(snap => {
        const container = document.getElementById('lists-container');
        container.innerHTML = '';
        snap.forEach(doc => {
          const data = doc.data();
          container.innerHTML += `
            <div class="list-item" style="cursor:pointer;position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;" data-id="${doc.id}">
              <div style="flex:1" onclick="window.location.href='liste.html?id=${doc.id}'">
                <strong>${data.name}</strong>
                <p>${data.desc}</p>
              </div>
                <button class="edit-list-btn" data-id="${doc.id}" style="background:#007aff;color:#fff;border:none;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:1.2em;cursor:pointer;margin-right:4px;box-shadow:0 2px 8px #0001;transition:background 0.2s;">✏️</button>
                <button class="delete-list-btn" data-id="${doc.id}" style="background:#ff4444;color:#fff;border:none;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:1.2em;cursor:pointer;box-shadow:0 2px 8px #0001;transition:background 0.2s;">🗑️</button>
            </div>`;
        });
        // Suppression d'une liste
        document.querySelectorAll('.delete-list-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (confirm('Supprimer cette liste ?')) {
              db.collection('lists').doc(id).delete();
            }
          };
        });
        // Modification d'une liste
        document.querySelectorAll('.edit-list-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const newName = prompt('Nouveau nom de la liste :');
            const newDesc = prompt('Nouvelle description de la liste :');
            if (newName && newName.trim() !== '') {
              db.collection('lists').doc(id).update({ name: newName, desc: newDesc });
            }
          };
        });
      });
      document.getElementById('add-list-form').onsubmit = (e) => {
        e.preventDefault();
        db.collection('lists').add({
          uid: user.uid,
          name: document.getElementById('l-name').value,
          desc: document.getElementById('l-desc').value,
          createdAt: firebase.firestore.FieldValue.serverTimestamp() // Utilise firebase importé
        }).then(() => e.target.reset());
      };
    }
  });
};

function renderCarsOfList(listId, uid) {
  document.getElementById('app-content').innerHTML = `
    <button onclick="window.location.href='liste.html'">← Retour</button>
    <h2>Voitures de la liste</h2>
    <div id="cars-list"></div>
  `;
  db.collection('cars').where('uid', '==', uid).where('listId', '==', listId).onSnapshot(snap => {
    const container = document.getElementById('cars-list');
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = '<p style="color:#888;">Aucune voiture dans cette liste.</p>';
      return;
    }
    snap.forEach(doc => {
      const car = doc.data();
      const div = document.createElement('div');
      div.className = 'car-inline-container';
      div.innerHTML = `
        <div class="car-inline-content">
          <img src="${car.photoURL}" class="car-inline-photo">
          <div style="display:flex;flex-direction:column;">
            <span class="car-inline-model">${car.model || ''}</span>
            <span class="car-inline-rarity" data-rarity="${car.rarity || 1}"></span>
          </div>
          <button class="move-car-btn" data-id="${doc.id}" style="margin-left:8px;background:#007aff;color:#fff;border:none;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:1em;cursor:pointer;box-shadow:0 2px 8px #0001;transition:background 0.2s;">⇄</button>
          <button class="delete-car-btn" data-id="${doc.id}" style="margin-left:8px;background:#ff4444;color:#fff;border:none;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:1em;cursor:pointer;box-shadow:0 2px 8px #0001;transition:background 0.2s;">🗑️</button>
        </div>
      `;
      div.onclick = (e) => {
        if (e.target.classList.contains('delete-car-btn')) return;
        openCarPopup(doc.id, car);
      };
      // Render rarity label text
      const rarityEl = div.querySelector('.car-inline-rarity');
      if (rarityEl) {
        const rarityMap = { 1: 'Très commun', 2: 'Commun', 3: 'Peu commun', 4: 'Rare', 5: 'Légendaire' };
        const r = (car.rarity && Number(car.rarity)) || 1;
        rarityEl.textContent = rarityMap[r] || 'Très commun';
      }
      // Suppression voiture
      // Déplacement voiture
      div.querySelector('.move-car-btn').onclick = (e) => {
        e.stopPropagation();
        // Récupère les listes de l'utilisateur
        db.collection('lists').where('uid', '==', uid).get().then(snap => {
          let options = '';
          snap.forEach(listDoc => {
            options += `<option value="${listDoc.id}" ${car.listId === listDoc.id ? 'selected' : ''}>${listDoc.data().name}</option>`;
          });
          const selectHtml = `<select id="move-list-select">${options}</select>`;
          const modal = document.createElement('div');
          modal.style = 'position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:2000;';
          modal.innerHTML = `<div style='background:#fff;padding:24px;border-radius:12px;box-shadow:0 4px 24px #0002;'>Changer de liste :<br>${selectHtml}<br><button id='move-list-btn' style='margin-top:12px;background:#007aff;color:#fff;border:none;padding:8px 18px;border-radius:8px;cursor:pointer;'>Valider</button></div>`;
          document.body.appendChild(modal);
          modal.querySelector('#move-list-btn').onclick = () => {
            const newListId = modal.querySelector('#move-list-select').value;
            db.collection('cars').doc(doc.id).update({ listId: newListId });
            modal.remove();
          };
          modal.onclick = (evt) => { if (evt.target === modal) modal.remove(); };
        });
      };
      // Suppression voiture
      div.querySelector('.delete-car-btn').onclick = (e) => {
        e.stopPropagation();
        if (confirm('Supprimer cette voiture ?')) {
          db.collection('cars').doc(doc.id).delete();
        }
      };
      container.appendChild(div);
    });
  });
}

function openCarPopup(carId, car) {
  // Crée la modale
  let modal = document.createElement('div');
  modal.className = 'modal-bg';
  // Gestion des photos multiples
  let photos = Array.isArray(car.photos) ? car.photos : (car.photoURL ? [car.photoURL] : []);
  let miniature = car.miniature || (photos[0] || '');
  let currentPhoto = photos.indexOf(miniature) !== -1 ? photos.indexOf(miniature) : 0;
  function renderPhotos() {
    let html = '';
    if (photos.length > 0) {
      html += `<div class="photo-carousel">
        <button type="button" id="prev-photo" class="photo-nav-btn" aria-label="Photo précédente">◀</button>
        <div class="photo-stage">
          <img class="photo-stage-image" src="${photos[currentPhoto]}" alt="Photo de voiture">
          <button type="button" id="zoom-photo" class="photo-zoom-btn" aria-label="Voir en grand"><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
        <button type="button" id="next-photo" class="photo-nav-btn" aria-label="Photo suivante">▶</button>
      </div>`;
      html += `<div class="photo-dots">${photos.map((p, i) => `<span class="photo-dot ${i === currentPhoto ? 'active' : ''}" data-idx="${i}" aria-label="Photo ${i + 1}"></span>`).join(' ')}</div>`;
      html += `<button type="button" id="set-miniature" class="miniature-btn ${miniature === photos[currentPhoto] ? 'is-active' : ''}">${miniature === photos[currentPhoto] ? 'Miniature sélectionnée' : 'Choisir comme miniature'}</button>`;
    } else {
      html = '<div style="text-align:center;color:#888;">Aucune photo</div>';
    }
    return html;
  }
  modal.innerHTML = `
  <div class="modal-content">
    <button id="close-modal" class="modal-close" aria-label="Fermer">✕</button>
    <h3 class="modal-title">Modifier la voiture</h3>
    <div id="photos-carousel">${renderPhotos()}</div>
    <form id="edit-car-form" class="modal-form">
      <label>Modèle</label>
      <input type="text" id="edit-model" value="${car.model || ''}" required>
      <label>Description</label>
      <textarea id="edit-desc">${car.desc || ''}</textarea>
      <label>Ajouter des photos</label>
      <input type="file" id="edit-photo" accept="image/*" multiple>
      <label>Rareté</label>
      <select id="edit-rarity">
        <option value="1" ${(car.rarity || 1) == 1 ? 'selected' : ''}>Très commun</option>
        <option value="2" ${(car.rarity || 1) == 2 ? 'selected' : ''}>Commun</option>
        <option value="3" ${(car.rarity || 1) == 3 ? 'selected' : ''}>Peu commun</option>
        <option value="4" ${(car.rarity || 1) == 4 ? 'selected' : ''}>Rare</option>
        <option value="5" ${(car.rarity || 1) == 5 ? 'selected' : ''}>Légendaire</option>
      </select>
      <button type="submit">Enregistrer</button>
    </form>
    <div id="edit-car-msg" class="modal-message"></div>
  </div>
`;
  Object.assign(modal.style, {
    position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
  });
  let content = modal.querySelector('.modal-content');
  Object.assign(content.style, {
    padding: '24px', borderRadius: '16px', maxWidth: '350px', width: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', position: 'relative'
  });
  document.body.appendChild(modal);
  modal.querySelector('#close-modal').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };

  // Navigation carrousel et choix miniature
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
      currentPhoto = photos.indexOf(miniature);
      modal.querySelector('#photos-carousel').innerHTML = renderPhotos();
    }
    if (e.target.dataset.idx) {
      currentPhoto = parseInt(e.target.dataset.idx);
      modal.querySelector('#photos-carousel').innerHTML = renderPhotos();
    }


    if (e.target.id === 'zoom-photo' || e.target.closest('#zoom-photo')) {
      const fullScreenModal = document.createElement('div');
      fullScreenModal.className = 'photo-zoom-modal';

      fullScreenModal.innerHTML = `
        <button id="close-zoom" class="photo-zoom-close" aria-label="Fermer la vue photo">✕</button>
        <img id="zoom-img" class="photo-zoom-image" src="${photos[currentPhoto]}" alt="Photo zoomée">
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

  modal.querySelector('#edit-car-form').onsubmit = async function (e) {
    e.preventDefault();
    const msg = modal.querySelector('#edit-car-msg');
    msg.innerText = 'Enregistrement...';
    let updates = {
      model: modal.querySelector('#edit-model').value,
      desc: modal.querySelector('#edit-desc').value,
      miniature
      , rarity: parseInt(modal.querySelector('#edit-rarity').value, 10)
    };
    const files = modal.querySelector('#edit-photo').files;
    if (files && files.length > 0) {
      try {
        for (let i = 0; i < files.length; i++) {
          const ref = storage.ref(`spots/${auth.currentUser.uid}/${Date.now()}_${files[i].name}`); // Utilise storage et auth importés
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
    }).catch(err => {
      msg.innerText = err.message;
    });
  };
}
