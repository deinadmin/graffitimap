<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { ref, computed, onMounted } from 'vue'
import { darkTheme, lightTheme } from 'naive-ui'
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup, LIcon } from "@vue-leaflet/vue-leaflet";
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import axios from 'axios'
import NewGraffitiCard from './components/NewGraffitiCard.vue'
import { collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore'
import { Icon } from 'leaflet'
import sprayBottleIcon from './assets/spraybottle.png'  // Importiere das Icon
import { NCard, NImage, NText } from 'naive-ui'
import ShowGraffitiModal from './components/ShowGraffitiModal.vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Person20Filled } from '@vicons/fluent'
import { NButton } from 'naive-ui'
import { h } from 'vue'
const loaded = ref(false)
const showAdminPanel = ref(false)
const clickedCoords = ref(null)

const updateTempMarker = () => {
  if (newGraffiti.value.lat && newGraffiti.value.lng) {
    tempMarker.value = {
      lat: parseFloat(newGraffiti.value.lat),
      lng: parseFloat(newGraffiti.value.lng)
    };
  } else {
    tempMarker.value = null;
  }
}

const handleMapClick = (event) => {
  if (user.value === null) return
  if (settingCoordinates.value) {
    const { lat, lng } = event.latlng
    newGraffiti.value.lat = lat.toFixed(9)
    newGraffiti.value.lng = lng.toFixed(9)
    updateTempMarker();
    settingCoordinates.value = false
  }
}
const newGraffiti = ref({
  lat: '',
  lng: '',
  title: '',
  imageURL: null
})

const logout = () => {
  signOut(auth)
}

const loginWithGoogle = () => {
  const provider = new GoogleAuthProvider()
  signInWithPopup(auth, provider)
    .then((result) => {
      // Der Benutzer hat sich erfolgreich angemeldet
      const user = result.user;
      // Überprüfe, ob der Benutzer bereits in der Datenbank existiert
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnap) => {
        if (!docSnap.exists()) {
          // Wenn der Benutzer nicht existiert, erstelle einen neuen Eintrag
          setDoc(userRef, {
            email: user.email,
            role: 'user'
          }).then(() => {
            console.log('Neuer Benutzer in der Datenbank erstellt');
          }).catch((error) => {
            console.error('Fehler beim Erstellen des Benutzers:', error);
          });
        }
      });
    })
    .catch((error) => {
      console.error('Fehler bei der Anmeldung:', error);
    });
}

const getUserRole = async () => {
  const userRef = doc(db, 'users', user.value.uid);
  const docSnap = await getDoc(userRef);
  userRole.value = docSnap.data().role;
}

const user = ref(null)
const userRole = ref('user')
const settingCoordinates = ref(false)

const graffitis = ref([])

const loadGraffitis = async () => {
  const graffitiCollection = collection(db, 'graffiti')
  const graffitiSnapshot = await getDocs(graffitiCollection)
  graffitis.value = graffitiSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))

  // Überprüfe die URL-Parameter auf ?open={id}
  const urlParams = new URLSearchParams(window.location.search);
  const openGraffitiId = urlParams.get('open');
  
  if (openGraffitiId) {
    const graffitiToOpen = graffitis.value.find(graffiti => graffiti.id === openGraffitiId);
    if (graffitiToOpen) {
      selectedGraffiti.value = graffitiToOpen;
      showGraffitiCard.value = true;
    } else {
      console.error('Das Graffiti wurde nicht gefunden.');
    }
  }


}


onMounted(async () => {
  onAuthStateChanged(auth, (u) => {
    if (u) {
      console.log(user)
      user.value = u
      loaded.value = true
      getUserRole();
    } else {
      console.log('No user logged in')
      user.value = null
      loaded.value = true
      userRole.value = 'user'
    }
  })
  await loadGraffitis()
})

// Neue Logik für das Theme
const isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

const currentTheme = computed(() => isDarkMode.value ? darkTheme : lightTheme)

const tileUrl = computed(() => 
  isDarkMode.value 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
)




// Überwache Änderungen des Betriebssystem-Themes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  isDarkMode.value = e.matches
})

const customIcon = new Icon({
  iconUrl: sprayBottleIcon,  // Verwende das importierte Icon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

// Füge einen ref für das ausgewählte Graffiti hinzu
const selectedGraffiti = ref(null)
const showGraffitiCard = ref(false)

// Funktion zum Auswählen eines Graffitis
const selectGraffiti = (graffiti) => {
  selectedGraffiti.value = graffiti
  showGraffitiCard.value = true
}

const reports = ref([])
const reportColumns = ref([
  { title: 'ID', key: 'id', width: 150 },
  { title: 'Grund', key: 'reason', width: 300 },
  { 
    title: 'Datum', 
    key: 'createdAt',
    width: 150,
    render(row) {
      // Formatiere das Datum in deutsches Format
      const date = new Date(row.createdAt.toDate());
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  },
  {
      title: "Aktionen",
      key: "actions",
      render(row) {
        return h(
          NButton,
          {
            strong: true,
            tertiary: true,
            size: "small",
            onClick: () => selectGraffiti(graffitis.value.find(graffiti => graffiti.id === row.graffitiId))
          },
          { default: () => "Graffiti öffnen" }
        );
      }
    }
])

const openAdminPanel = async () => {
  const reportsCollection = collection(db, 'reports')
  const reportsSnapshot = await getDocs(reportsCollection)
  reports.value = reportsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))

  showAdminPanel.value = true
}


const tempMarker = ref(null);

const resetNewGraffiti = () => {
  newGraffiti.value = {
    lat: '',
    lng: '',
    title: '',
    imageURL: null
  }
  tempMarker.value = null
}

</script>

<template>
  <n-modal-provider>
    <n-config-provider :theme="currentTheme">
      <n-message-provider>
        <div id="app" v-if="loaded">
          <LMap 
            :style="{ background: isDarkMode ? '#000' : '#fff', cursor: settingCoordinates ? 'crosshair!important' : 'grab' }" 
            :use-global-leaflet="false" 
            style="height: 100vh; width: 100vw;" 
            :zoom="13" 
            :center="[54.3233, 10.1228]" 
            @click="handleMapClick"
          >
            <LTileLayer :url="tileUrl"></LTileLayer>
            
            <LMarker v-for="graffiti in graffitis" :key="graffiti.id" :lat-lng="[graffiti.lat, graffiti.lng]" :icon="customIcon" @click="selectGraffiti(graffiti)">
            </LMarker>
            
            <LMarker v-if="tempMarker" :lat-lng="[tempMarker.lat, tempMarker.lng]">
              <LIcon :icon-url="'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png'" :icon-size="[25, 41]" :icon-anchor="[12, 41]" />
            </LMarker>
          </LMap>
          <NewGraffitiCard 
            :user="user" 
            :newGraffiti="newGraffiti" 
            :settingCoordinates="settingCoordinates" 
            :loginWithGoogle="loginWithGoogle" 
            @graffiti-added="loadGraffitis(); resetNewGraffiti()"
            @update:settingCoordinates="settingCoordinates = $event"
            @coordinates-changed="updateTempMarker"
          />
          
          <ShowGraffitiModal 
            :showGraffitiCard="showGraffitiCard" 
            @update:showGraffitiCard="showGraffitiCard = $event"
            :selectedGraffiti="selectedGraffiti" 
            :user="user" 
            :userRole="userRole"
            @graffitiDeleted="loadGraffitis"
            :signInWithGoogle="loginWithGoogle"
          />

          <n-popover v-if="user" width="250px" trigger="click">
            <template #trigger>
              <n-avatar round size="large" style="cursor: pointer; position: absolute; top: 10px; right: 12px; z-index: 1000;" :src="user.photoURL" />
            </template>
            <template #header>
              <n-text strong>
                <b>Benutzerinfos</b>
              </n-text>
            </template>
            {{ user.email }}
            <br>
            Rolle: {{ userRole === 'admin' ? 'Admin' : 'Benutzer' }}
            <template #footer>
              <n-button style="margin-bottom: 10px;" v-if="userRole === 'admin'" @click="openAdminPanel" block type="secondary" size="small">Admin Panel</n-button>
              <n-button @click="logout" block type="error" size="small">Logout</n-button>
            </template>
          </n-popover>
          <n-tooltip v-else>
            <template #trigger>
              <n-avatar @click="loginWithGoogle" round size="large" style="cursor: pointer; position: absolute; top: 10px; right: 12px; z-index: 1000;">
                <n-icon>
                  <Person20Filled />
                </n-icon>
              </n-avatar>
            </template>
            Login
          </n-tooltip>
        </div>
        <div v-else :style="'height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; background: ' + (isDarkMode ? '#000' : '#fff') + ';'">
          <n-spin size="large" :show="true" />
        </div>
        <n-modal v-model:show="showAdminPanel">
          <n-card style="width: 800px;" title="Admin Panel">
            <h3>Gemeldete Graffiti</h3>
            <n-data-table :columns="reportColumns" :data="reports" />
          </n-card>
        </n-modal>
      </n-message-provider>
    </n-config-provider>
  </n-modal-provider>
</template>

<style>
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  height: 100vh;
  width: 100vw;
}
.leaflet-control-attribution {
  display: none !important;
}
.leaflet-control-zoom {
  display: none !important;
}
/* Restlicher Stil bleibt unverändert */
.leaflet-div-icon {
  background: transparent;
  border: none;
}

.graffiti-card {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  max-width: 300px;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

/* Füge einen Medienquery für kleinere Bildschirme hinzu */
@media (max-width: 600px) {
  .graffiti-card {
    left: 10px;
    right: 10px;
    max-width: none;
  }
}
.setting-coordinates {
  cursor: crosshair!important;
}
.leaflet-container {
  cursor: inherit !important;
}
</style>
