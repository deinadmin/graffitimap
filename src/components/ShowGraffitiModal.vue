<template>
  <!-- Benutzerdefinierte Karte für ausgewähltes Graffiti -->
  <div>
    <n-modal :show="showGraffitiCard" @update:show="$emit('update:showGraffitiCard', $event)" closable>
        <n-card
            title="Informationen"
            :bordered="false"
            size="huge"
            role="dialog"
            aria-modal="true"
            style="width: 600px;"
        >
        <div id="graffiti-card-content">

            <n-tooltip trigger="hover" placement="bottom">
            <template #trigger>
                <n-image :src="selectedGraffiti.imageURL" alt="Graffiti" width="200px" style="margin-right: 20px;" />
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
        <template #footer>
            <n-button style="margin-right: 10px;"@click="shareGraffiti(selectedGraffiti.id)" type="info" size="small">Graffiti teilen</n-button>
            <n-button v-if="userRole === 'admin'" @click="deleteGraffiti(selectedGraffiti.id)" type="error" size="small">Graffiti löschen</n-button>
            <n-button @click="reportGraffitiModal = true" v-else-if="user !== null" type="error" size="small">Graffiti melden</n-button>
        </template>
        </n-card>
    </n-modal>
    <n-modal v-model:show="shareGraffitiModal">
        <n-card title="Graffiti teilen" style="width: 300px;">
            <n-qr-code size="230" :value="shareGraffitiLink" />
            <n-input-group>
                <n-input readonly v-model:value="shareGraffitiLink" />
                <n-button @click="copyToClipboard"><n-icon size="22" :component="Copy16Regular" /></n-button>
            </n-input-group>
        </n-card>
    </n-modal>
    <n-modal v-model:show="reportGraffitiModal">
        <n-card style="width: 400px;" title="Graffiti melden">
          <n-text>Aus welchem Grund möchtest du das Graffiti melden?</n-text>
          <n-select style="margin-top: 10px;" placeholder="Bitte wähle einen Grund" v-model:value="reportReason" :options="reportReasons" />
          <n-input v-if="reportReason === 'other'" style="margin-top: 10px;" v-model:value="reportDescription" type="textarea" placeholder="Beschreibung" />
          <n-button style="margin-top: 10px;" @click="reportGraffiti(selectedGraffiti.id)" type="error" size="small">Graffiti melden</n-button>
        </n-card>
    </n-modal>
  </div>
</template>

<script setup>
import { db } from '../firebase';
import { deleteDoc, doc, collection, addDoc } from 'firebase/firestore';
import { useMessage } from 'naive-ui';
import { ref } from 'vue';
import { Copy16Regular } from '@vicons/fluent';

const message = useMessage()
const props = defineProps({
  showGraffitiCard: Boolean,
  selectedGraffiti: Object,
  user: Object,
  userRole: String,
})

const shareGraffitiModal = ref(false)
const shareGraffitiLink = ref('')
const reportGraffitiModal = ref(false)
const emit = defineEmits(['update:showGraffitiCard'])
const reportReason = ref(null)
const reportReasons = ref([
  { label: 'Graffiti ist nicht mehr da', value: 'graffiti_not_found' },
  { label: 'Graffiti ist nicht mehr lesbar', value: 'graffiti_unreadable' },
  { label: 'Auf dem Bild ist kein Graffiti zu sehen', value: 'no_graffiti_on_image' },
  { label: 'Spam', value: 'spam' },
  { label: 'Anderes', value: 'other' },
])

const reportDescription = ref('')

const deleteGraffiti = async (id) => {
  await deleteDoc(doc(db, 'graffiti', id));
  emit('update:showGraffitiCard', false);
  // Hier müssen wir noch eine Möglichkeit finden, loadGraffitis aufzurufen
  // Eine Möglichkeit wäre, ein neues Event zu emittieren
  emit('graffitiDeleted');
  message.success('Graffiti erfolgreich gelöscht.');
}

const shareGraffiti = (id) => {
  shareGraffitiLink.value = `https://opengraffitimap.netlify.app/?open=${id}`;
  shareGraffitiModal.value = true;
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(shareGraffitiLink.value);
  message.success('Link erfolgreich in die Zwischenablage kopiert.');
}


const reportGraffiti = async (id) => {
  if (!reportReason.value) {
    message.error('Bitte wähle einen Grund, warum du das Graffiti melden möchtest.');
    return;
  }
  if (reportReason.value === 'other' && reportDescription.value.length < 10) {
    message.error('Bitte gib eine Beschreibung für den Grund an, die mindestens 10 Zeichen lang ist.');
    return;
  }

  await addDoc(collection(db, 'reports'), {
    graffitiId: id,
    userId: props.user.uid,
    createdAt: new Date(),
    reason: reportReason.value === 'other' ? reportDescription.value : reportReason.value
  });
  message.success('Graffiti erfolgreich gemeldet.');
  reportReason.value = null;
  reportDescription.value = '';
  reportGraffitiModal.value = false;
}
</script>

<style scoped>

@media (min-width: 600px) {
  #graffiti-card-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: left;
  }
}

</style>