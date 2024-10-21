<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { ref, computed, onMounted } from 'vue'
import { darkTheme, lightTheme } from 'naive-ui'
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import axios from 'axios'
import NewGraffitiCard from './components/NewGraffitiCard.vue'
import { collection, getDocs } from 'firebase/firestore'
import { Icon } from 'leaflet'
import sprayBottleIcon from './assets/spraybottle.png'  // Importiere das Icon
import { NCard, NImage, NText } from 'naive-ui'

const loaded = ref(false)

const clickedCoords = ref(null)

const handleMapClick = (event) => {
  const { lat, lng } = event.latlng
  newGraffiti.value.lat = lat.toFixed(9)
  newGraffiti.value.lng = lng.toFixed(9)
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
}

const user = ref(null)

const graffitis = ref([])

const loadGraffitis = async () => {
  const graffitiCollection = collection(db, 'graffiti')
  const graffitiSnapshot = await getDocs(graffitiCollection)
  graffitis.value = graffitiSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

onMounted(async () => {
  onAuthStateChanged(auth, (u) => {
    if (u) {
      console.log(user)
      user.value = u
      loaded.value = true

    } else {
      console.log('No user logged in')
      user.value = null
      loaded.value = true

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


</script>

<template>
  <n-modal-provider>
    <n-config-provider :theme="currentTheme">
      <n-message-provider>
        <div id="app" v-if="loaded">
          <LMap :style="{ background: isDarkMode ? '#000' : '#fff' }" :use-global-leaflet="false" style="height: 100vh; width: 100%;" :zoom="13" :center="[54.3233, 10.1228]" @click="handleMapClick">
            <LTileLayer :url="tileUrl"></LTileLayer>
            <LMarker v-for="graffiti in graffitis" :key="graffiti.id" :lat-lng="[graffiti.lat, graffiti.lng]" :icon="customIcon" @click="selectGraffiti(graffiti)">
            </LMarker>
          </LMap>
          <NewGraffitiCard :user="user" :newGraffiti="newGraffiti" :loginWithGoogle="loginWithGoogle" @graffiti-added="loadGraffitis" />
          
          <!-- Benutzerdefinierte Karte für ausgewähltes Graffiti -->
          <n-modal v-model:show="showGraffitiCard" closable>
            <n-card
              title="Informationen"
              :bordered="false"
              size="huge"
              role="dialog"
              aria-modal="true"
              style="width: 600px;"
            >
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: left;">

              <n-tooltip trigger="hover" placement="bottom">
                <template #trigger>
                  <n-image  :src="selectedGraffiti.imageURL" alt="Graffiti" width="200px" style="margin-right: 20px;" />
                </template>
                Klicke um das Bild zu vergrößern.
              </n-tooltip>
              <div>
                <h3 style="margin-bottom: 0;">Koordinaten:</h3>
                <n-text code>Lat: {{ selectedGraffiti.lat }}, Lng: {{ selectedGraffiti.lng }}</n-text>
                <h3 style="margin-bottom: 0;">Beschreibung:</h3>
                <n-text>
                  {{ selectedGraffiti.title }}
                </n-text>
              </div>
            </div>
              
            </n-card>
          </n-modal>

          <div v-if="user">
            <n-popover width="250px" trigger="click">
              <template #trigger>
                <n-avatar round size="large" style="position: absolute; top: 10px; right: 12px; z-index: 1000;" :src="user.photoURL" />
              </template>
              <template #header>
                <n-text strong>
                  <b>Benutzerinfos</b>
                </n-text>
              </template>
              {{ user.email }}
              <template #footer>
                <n-button @click="logout" block type="error" size="small">Logout</n-button>
              </template>
            </n-popover>
          </div>
        </div>
        <div v-else :style="'height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; background: ' + (isDarkMode ? '#000' : '#fff') + ';'">
          <n-spin size="large" :show="true" />
        </div>
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
</style>
