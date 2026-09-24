const DEFAULT_PREFERENCES = {
  themeColor: '#007aff',
  backgroundColor: '#f2f2f7',
  gradientStart: '#007aff',
  gradientEnd: '#5ac8fa',
  animateGradient: false,
  backgroundImage: '',
  textColor: '#1c1c1e',
  titleColor: '#1c1c1e',
  buttonColor: '#007aff',
  buttonTextColor: '#ffffff'
};

const PREFERENCES_STORAGE_KEY = 'carspot-user-settings';
let gradientAnimationInterval = null;

function getStoredPreferences() {
  try {
    const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : { ...DEFAULT_PREFERENCES };
  } catch (error) {
    return { ...DEFAULT_PREFERENCES };
  }
}

function setGradientBg(c1, c2, animate = false) {
  if (gradientAnimationInterval) {
    clearInterval(gradientAnimationInterval);
    gradientAnimationInterval = null;
  }

  if (animate && c2 && c2 !== '') {
    let angle = 0;
    gradientAnimationInterval = setInterval(() => {
      angle = (angle + 1) % 360;
      document.body.style.background = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
    }, 50);
  } else if (c2 && c2 !== '') {
    document.body.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  } else {
    document.body.style.background = c1;
  }
}

window.applyThemeColor = async function (color) {
  const ua = navigator.userAgent;
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isSafari = /^((?!chrome|android|crios|fxios|edgios|opr|samsungbrowser).)*safari/i.test(ua);
  if (isMac && isSafari) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color || '#007aff');
  }
};

window.CarSpotPreferences = {
  defaults: { ...DEFAULT_PREFERENCES },

  getCurrent() {
    return getStoredPreferences();
  },

  apply(settings = getStoredPreferences()) {
    const prefs = { ...DEFAULT_PREFERENCES, ...settings };
    const root = document.documentElement;

    root.style.setProperty('--primary', prefs.themeColor || '#007aff');
    root.style.setProperty('--bg', prefs.backgroundColor || '#f2f2f7');
    root.style.setProperty('--text', prefs.textColor || '#1c1c1e');
    root.style.setProperty('--card-bg', 'rgba(255,255,255,0.32)');
    root.style.setProperty('--title-color', prefs.titleColor || prefs.textColor || '#1c1c1e');

    document.body.style.color = prefs.textColor || '#1c1c1e';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';

    if (prefs.gradientStart || prefs.gradientEnd) {
      setGradientBg(prefs.gradientStart || '#007aff', prefs.gradientEnd || '', !!prefs.animateGradient);
    } else if (prefs.backgroundImage) {
      document.body.style.background = `url(${prefs.backgroundImage}) center/cover no-repeat fixed`;
    } else {
      document.body.style.background = prefs.backgroundColor || '#f2f2f7';
    }

    document.querySelectorAll('h1,h2,h3').forEach((element) => {
      element.style.color = prefs.titleColor || prefs.textColor || '#1c1c1e';
    });

    document.querySelectorAll('button').forEach((button) => {
      button.style.background = prefs.buttonColor || prefs.themeColor || '#007aff';
      button.style.color = prefs.buttonTextColor || '#ffffff';
    });

    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
    window.applyThemeColor(prefs.themeColor || '#007aff');
    return prefs;
  },

  async save(settings) {
    const merged = { ...this.getCurrent(), ...settings };
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(merged));

    if (window.auth && window.auth.currentUser && window.db) {
      const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
      await userRef.set({ preferences: merged }, { merge: true });
    }

    this.apply(merged);
    return merged;
  },

  async refresh() {
    let preferences = this.getCurrent();

    if (window.auth && window.auth.currentUser && window.db) {
      try {
        const userDoc = await window.db.collection('users').doc(window.auth.currentUser.uid).get();
        if (userDoc.exists && userDoc.data().preferences) {
          preferences = { ...DEFAULT_PREFERENCES, ...preferences, ...userDoc.data().preferences };
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
        }
      } catch (error) {
        // Ignore sync errors and keep local fallback
      }
    }

    this.apply(preferences);
    return preferences;
  },

  async reset() {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);

    if (window.auth && window.auth.currentUser && window.db) {
      const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
      await userRef.set({ preferences: DEFAULT_PREFERENCES }, { merge: true });
    }

    this.apply({ ...DEFAULT_PREFERENCES });
    return { ...DEFAULT_PREFERENCES };
  }
};

window.applyStoredBg = function () {
  window.CarSpotPreferences.apply();
};

window.applyStoredThemeColor = async function (color) {
  const prefs = window.CarSpotPreferences.getCurrent();
  const themeColor = color || prefs.themeColor || '#007aff';
  if (window.CarSpotPreferences && window.CarSpotPreferences.apply) {
    window.CarSpotPreferences.apply({ ...prefs, themeColor });
  }
  window.applyThemeColor(themeColor);
};

const firebaseConfig = {
  apiKey: "AIzaSyBR_uHqxZhdIIHzhWyFNQaAQZ8uHyXf20c",
  authDomain: "carspot-d6ff9.firebaseapp.com",
  projectId: "carspot-d6ff9",
  storageBucket: "carspot-d6ff9.firebasestorage.app",
  messagingSenderId: "1020332551922",
  appId: "1:1020332551922:web:7ab8a7bbd808f674d52a6b",
  measurementId: "G-YCVWCRSW91"
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
window.storage = firebase.storage();
window.auth = firebase.auth();

window.addEventListener('DOMContentLoaded', function () {
  if (window.auth) {
    window.auth.onAuthStateChanged(async function (user) {
      if (user) {
        await window.CarSpotPreferences.refresh();
      } else {
        window.CarSpotPreferences.apply(window.CarSpotPreferences.getCurrent());
      }
    });
  } else {
    window.CarSpotPreferences.apply(window.CarSpotPreferences.getCurrent());
  }
});

window.CarSpotPreferences.apply(window.CarSpotPreferences.getCurrent());