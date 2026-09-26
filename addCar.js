import { db, storage, auth } from './firebase-config.js'; // Importe db, storage, auth depuis firebase-config.js
import { showPage } from './main.js'; // Importe showPage depuis main.js

export function renderAddCarPage() {
  document.getElementById('app-content').innerHTML = `
    <h2>Ajouter une voiture</h2>
    <form id="add-car-form">
      <input type="file" id="car-photo" accept="image/*" required />
      <input type="text" id="car-title" placeholder="Titre" required />
      <input type="text" id="car-desc" placeholder="Description" required />
      <input type="text" id="car-model" placeholder="Modèle" required />
      <select id="car-list" required></select>
      <select id="car-rarity" required>
        <option value="1">Très commun</option>
        <option value="2">Commun</option>
        <option value="3">Peu commun</option>
        <option value="4">Rare</option>
        <option value="5">Légendaire</option>
      </select>
      <button type="submit">Enregistrer</button>
      <div id="add-car-message"></div>
    </form>
  `;
  // Charger les listes de l'utilisateur
  auth.onAuthStateChanged(function (user) { // Utilise auth importé
    if (!user) return;
    db.collection('lists').where('uid', '==', user.uid).get().then(snapshot => {
      const select = document.getElementById('car-list');
      if (snapshot.empty) {
        select.innerHTML = '<option value="">Créez d\'abord une liste !</option>';
        return;
      }
      snapshot.forEach(doc => {
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.textContent = doc.data().name;
        select.appendChild(opt);
      });
    });
  });

  document.getElementById('add-car-form').onsubmit = function (e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.innerText = 'Envoi...';
    const file = document.getElementById('car-photo').files[0];
    const title = document.getElementById('car-title').value;
    const desc = document.getElementById('car-desc').value;
    const model = document.getElementById('car-model').value;
    const listId = document.getElementById('car-list').value;
    const rarity = parseInt(document.getElementById('car-rarity').value, 10);
    auth.onAuthStateChanged(function (user) { // Utilise auth importé
      if (!user) return;
      const storageRef = storage.ref('cars/' + user.uid + '/' + Date.now() + '_' + file.name);
      storageRef.put(file).then(snapshot => {
        return snapshot.ref.getDownloadURL();
      }).then(photoURL => {
        return db.collection('cars').add({
          uid: user.uid,
          title,
          desc,
          model,
          listId,
          rarity,
          photoURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }).then(() => {
        document.getElementById('add-car-message').innerText = 'Voiture ajoutée !';
        document.getElementById('add-car-form').reset();
        setTimeout(() => showPage('cars'), 1500);
      }).catch(err => {
        document.getElementById('add-car-message').innerText = err.message;
        btn.disabled = false; btn.innerText = 'Enregistrer';
      });
    });
  };
}